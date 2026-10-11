import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Photo } from "@medusajs/icons";
import { Button, Container, Heading, Input, Label, Text, Textarea } from "@medusajs/ui";
import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string; title: string; description: string; eyebrow: string;
  button_label: string; button_link: string; secondary_label: string; secondary_link: string;
  image_id: string | null; image_url: string; image_alt: string; enabled: boolean;
  position: "center" | "right center" | "left bottom"; zoom: number;
};
type Draft = Slide & { file?: File; preview?: string };
type SliderResponse = { configured: boolean; revision: number; slides: Slide[]; fallback_image_url?: string };
const fallbackImage = "/images/hero-amoon-rack.png";
const blankSlide = (): Slide => ({
  id: crypto.randomUUID(), title: "Nouvelle collection", description: "", eyebrow: "AMOON COLLECTION",
  button_label: "Découvrir la collection", button_link: "/boutique", secondary_label: "", secondary_link: "",
  image_id: null, image_url: fallbackImage, image_alt: "Collection Amoon", enabled: true, position: "center", zoom: 1,
});
const fallbackSlides = (): Slide[] => (["center", "right center", "left bottom"] as const).map((position, index) => ({
  ...blankSlide(), title: "Des pièces qui vous\nressemblent.",
  description: "Confortables, féminines et faciles à porter.\nDécouvrez la nouvelle collection Amoon.", eyebrow: "NOUVELLE COLLECTION · AMOON",
  button_label: "DÉCOUVRIR LA COLLECTION", secondary_label: "Voir les nouveautés", secondary_link: "/nouveautes",
  image_alt: "Collection Amoon : vêtements bordeaux, ivoire et blush sur un portant", position, zoom: [1, 1.2, 1.35][index],
}));

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    credentials: "include", method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Votre session a expiré. Reconnectez-vous à l’administration." : data.message || "La demande a échoué. Réessayez.");
  return data as T;
}
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

const HomepageSliderPage = () => {
  const [slides, setSlides] = useState<Draft[]>([]);
  const [revision, setRevision] = useState(0);
  const [fallbackUrl, setFallbackUrl] = useState(fallbackImage);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const previewUrls = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    request<SliderResponse>("/admin/homepage-slider").then(data => {
      if (cancelled) return;
      setSlides(data.configured ? data.slides : fallbackSlides()); setRevision(data.revision);
      setFallbackUrl(data.fallback_image_url || fallbackImage);
      setLoaded(true);
    }).catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const edit = (id: string, values: Partial<Draft>) => {
    setSlides(current => current.map(slide => slide.id === id ? { ...slide, ...values } : slide));
    setDirty(true); setNotice("");
  };
  const move = (index: number, direction: number) => {
    setSlides(current => { const next = [...current]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next; });
    setDirty(true); setNotice("");
  };
  const selectImage = (id: string, file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024 || !file.size) {
      setError("Choisissez un JPEG, PNG ou WebP de 10 Mo maximum."); return;
    }
    const preview = URL.createObjectURL(file);
    previewUrls.current.add(preview);
    setError(""); edit(id, { file, preview });
  };
  const save = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const saved: Slide[] = [];
      for (const draft of slides) {
        const { file, ...slide } = draft;
        delete slide.preview;
        if (file) {
          const { image } = await request<{ image: { id: string; url: string } }>("/admin/homepage-slider/images", { mime_type: file.type, content: await readImage(file) });
          slide.image_id = image.id; slide.image_url = image.url;
          edit(slide.id, { image_id: image.id, image_url: image.url, file: undefined, preview: undefined });
        }
        saved.push(slide);
      }
      const result = await request<SliderResponse>("/admin/homepage-slider", { slides: saved, revision });
      setSlides(result.slides); setRevision(result.revision); setDirty(false);
      setNotice("Bannières enregistrées. Rechargez l’accueil de la boutique pour voir les changements.");
    } catch (error) { setError(error instanceof Error ? error.message : "Impossible d’enregistrer les bannières."); }
    finally { setBusy(false); }
  };

  return <Container className="p-0">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
      <div><Heading level="h1">Bannières / Slider</Heading><Text className="text-ui-fg-subtle">Gérez les diapositives de la page d’accueil. Les modifications sont publiées après enregistrement.</Text></div>
      <Button type="submit" form="homepage-slider-form" disabled={!loaded || busy || (!dirty && revision > 0)} isLoading={busy}>Enregistrer</Button>
    </div>
    <div className="space-y-6 p-6">
      {error && <div role="alert" className="rounded border border-ui-border-error p-3 text-ui-fg-error">{error}</div>}
      {notice && <div role="status" className="rounded border p-3 text-ui-fg-base">{notice}</div>}
      {loading ? <Text>Chargement des bannières…</Text> : loaded && <form id="homepage-slider-form" onSubmit={event => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy} className="space-y-6">
          <Text className="text-ui-fg-subtle">JPEG, PNG ou WebP non animé · 10 Mo maximum · 6000 × 6000 pixels / 25 mégapixels maximum. Conseil : une photo horizontale, avec le sujet au centre. Maximum 12 diapositives.</Text>
          {!slides.length && <Text>Aucune diapositive. L’accueil masquera le slider après enregistrement.</Text>}
          {slides.map((slide, index) => <section key={slide.id} className="space-y-4 rounded-lg border p-4" aria-labelledby={`slide-${slide.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Heading level="h2" id={`slide-${slide.id}`}>Diapositive {index + 1}</Heading>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slide.enabled} onChange={event => edit(slide.id, { enabled: event.target.checked })}/>Activée</label>
                <Button type="button" variant="secondary" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Monter la diapositive ${index + 1}`}>↑</Button>
                <Button type="button" variant="secondary" disabled={index === slides.length - 1} onClick={() => move(index, 1)} aria-label={`Descendre la diapositive ${index + 1}`}>↓</Button>
                <Button type="button" variant="danger" onClick={() => { setSlides(current => current.filter(item => item.id !== slide.id)); setDirty(true); setNotice(""); }}>Supprimer</Button>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <img src={slide.preview || (slide.image_url === fallbackImage ? fallbackUrl : slide.image_url)} alt={slide.image_alt} className="h-64 w-full rounded bg-ui-bg-subtle object-cover" style={{ objectPosition: slide.position }}/>
                <Label htmlFor={`image-${slide.id}`}>Importer / remplacer l’image</Label>
                <input id={`image-${slide.id}`} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={event => selectImage(slide.id, event.target.files?.[0])}/>
                {slide.file && <Text size="small">Aperçu : {slide.file.name} · sera importée à l’enregistrement.</Text>}
                <Label htmlFor={`alt-${slide.id}`}>Description de l’image (accessibilité)</Label>
                <Input id={`alt-${slide.id}`} required maxLength={200} value={slide.image_alt} onChange={event => edit(slide.id, { image_alt: event.target.value })}/>
              </div>
              <div className="space-y-3">
                <Label htmlFor={`eyebrow-${slide.id}`}>Petit texte au-dessus du titre</Label><Input id={`eyebrow-${slide.id}`} maxLength={80} value={slide.eyebrow} onChange={event => edit(slide.id, { eyebrow: event.target.value })}/>
                <Label htmlFor={`title-${slide.id}`}>Titre</Label><Textarea id={`title-${slide.id}`} required maxLength={140} value={slide.title} onChange={event => edit(slide.id, { title: event.target.value })}/>
                <Label htmlFor={`description-${slide.id}`}>Description</Label><Textarea id={`description-${slide.id}`} maxLength={500} value={slide.description} onChange={event => edit(slide.id, { description: event.target.value })}/>
                <Label htmlFor={`button-${slide.id}`}>Texte du bouton principal</Label><Input id={`button-${slide.id}`} required maxLength={80} value={slide.button_label} onChange={event => edit(slide.id, { button_label: event.target.value })}/>
                <Label htmlFor={`link-${slide.id}`}>Lien du bouton principal</Label><Input id={`link-${slide.id}`} required maxLength={2048} placeholder="/boutique" value={slide.button_link} onChange={event => edit(slide.id, { button_link: event.target.value })}/>
                <Label htmlFor={`secondary-${slide.id}`}>Texte du bouton secondaire (facultatif)</Label><Input id={`secondary-${slide.id}`} maxLength={80} value={slide.secondary_label} onChange={event => edit(slide.id, { secondary_label: event.target.value })}/>
                <Label htmlFor={`secondary-link-${slide.id}`}>Lien du bouton secondaire</Label><Input id={`secondary-link-${slide.id}`} maxLength={2048} value={slide.secondary_link} onChange={event => edit(slide.id, { secondary_link: event.target.value })}/>
                <Text size="small" className="text-ui-fg-subtle">Liens : chemin interne (/boutique) ou URL HTTPS. Un retour à la ligne dans le titre conserve la mise en valeur de la seconde ligne.</Text>
              </div>
            </div>
          </section>)}
          <Button type="button" variant="secondary" disabled={slides.length >= 12} onClick={() => { setSlides(current => [...current, blankSlide()]); setDirty(true); setNotice(""); }}>Ajouter une diapositive</Button>
          <div><Button type="submit" disabled={!dirty && revision > 0} isLoading={busy}>Enregistrer les bannières</Button></div>
        </fieldset>
      </form>}
    </div>
  </Container>;
};

export const config = defineRouteConfig({ label: "Bannières / Slider", icon: Photo });
export const handle = { breadcrumb: () => "Bannières / Slider" };
export default HomepageSliderPage;
