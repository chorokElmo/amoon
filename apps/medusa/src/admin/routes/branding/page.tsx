import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Photo } from "@medusajs/icons";
import { Button, Container, Heading, Label, Text } from "@medusajs/ui";
import { useEffect, useRef, useState } from "react";

const slots = ["header_logo", "footer_logo", "favicon"] as const;
type Slot = typeof slots[number];
type Image = { id: string; url: string; width: number; height: number };
type ResponseData = { revision: number; assets: Record<Slot, string | null>; images: Record<Slot, Image | null>; defaults?: Record<Slot, string> };
type Draft = { id: string | null; url: string; file?: File; preview?: string; mime?: string };
const labels: Record<Slot, string> = { header_logo: "Logo d’en-tête", footer_logo: "Logo de pied de page", favicon: "Favicon" };
const empty = (): Record<Slot, Draft> => ({ header_logo: { id: null, url: "" }, footer_logo: { id: null, url: "" }, favicon: { id: null, url: "" } });

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, { credentials: "include", method: body === undefined ? "GET" : "POST", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Votre session a expiré. Reconnectez-vous à l’administration." : data.message || "La demande a échoué. Réessayez.");
  return data;
}
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Impossible de lire le fichier.")); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });
}
function fileMime(file: File) {
  if (file.name.toLowerCase().endsWith(".ico")) return "image/x-icon";
  return file.type;
}
const BrandingPage = () => {
  const [drafts, setDrafts] = useState(empty);
  const [defaults, setDefaults] = useState<Record<Slot, string>>({ header_logo: "", footer_logo: "", favicon: "" });
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const urls = useRef(new Set<string>());
  const inputs = useRef<Partial<Record<Slot, HTMLInputElement | null>>>({});
  const needsSvgPreview = slots.some(slot => drafts[slot].file && drafts[slot].mime === "image/svg+xml");
  const apply = (data: ResponseData) => {
    setRevision(data.revision);
    setDrafts(Object.fromEntries(slots.map(slot => [slot, { id: data.assets[slot], url: data.images[slot]?.url || "" }])) as Record<Slot, Draft>);
  };
  useEffect(() => {
    let cancelled = false;
    request<ResponseData>("/admin/branding").then(data => { if (!cancelled) { apply(data); setDefaults(data.defaults!); setLoaded(true); } }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { const previews = urls.current; return () => previews.forEach(url => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const select = (slot: Slot, file?: File) => {
    if (!file) return;
    const mime = fileMime(file);
    const types = slot === "favicon" ? ["image/png", "image/x-icon", "image/vnd.microsoft.icon"] : ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!types.includes(mime) || !file.size || file.size > (slot === "favicon" ? 1 : 5) * 1024 * 1024) { setError(slot === "favicon" ? "Choisissez un PNG ou ICO de 1 Mo maximum." : "Choisissez un PNG, JPG, WebP ou SVG simple de 5 Mo maximum."); if (inputs.current[slot]) inputs.current[slot]!.value = ""; return; }
    // Untrusted SVG is never rendered in the browser. Its safe PNG preview comes from the backend.
    const preview = mime === "image/svg+xml" ? undefined : URL.createObjectURL(file);
    if (preview) urls.current.add(preview);
    setDrafts(current => ({ ...current, [slot]: { ...current[slot], file, mime, preview } })); setDirty(true); setNotice(""); setError("");
  };
  const upload = async (slot: Slot, draft: Draft) => {
    const { image } = await request<{ image: Image }>("/admin/branding/images", { slot, mime_type: draft.mime, content: await readFile(draft.file!) });
    setDrafts(current => ({ ...current, [slot]: { id: image.id, url: image.url } }));
    if (inputs.current[slot]) inputs.current[slot]!.value = "";
    return image.id;
  };
  const previewSvg = async (slot: Slot) => {
    setBusy(true); setError("");
    try { await upload(slot, drafts[slot]); setNotice("SVG validé. Vérifiez l’aperçu, puis enregistrez pour le publier."); }
    catch (e) { setError(e instanceof Error ? e.message : "Impossible de valider le SVG."); }
    finally { setBusy(false); }
  };
  const save = async (restore = false) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const assets: Record<Slot, string | null> = { header_logo: null, footer_logo: null, favicon: null };
      if (!restore) for (const slot of slots) assets[slot] = drafts[slot].file ? await upload(slot, drafts[slot]) : drafts[slot].id;
      const data = await request<ResponseData>("/admin/branding", { revision, assets });
      apply(data); setDirty(false); setConfirmRestore(false);
      slots.forEach(slot => { if (inputs.current[slot]) inputs.current[slot]!.value = ""; });
      setNotice(restore ? "Identité visuelle par défaut restaurée." : "Identité visuelle enregistrée. Rechargez la boutique pour voir les changements.");
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible d’enregistrer l’identité visuelle."); }
    finally { setBusy(false); }
  };
  return <Container className="p-0">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4"><div><Heading level="h1">Logo & Identité visuelle</Heading><Text className="text-ui-fg-subtle">Personnalisez les logos et l’icône de votre boutique. Publiez vos changements après vérification des aperçus.</Text></div><Button disabled={!loaded || busy || !dirty || confirmRestore || needsSvgPreview} isLoading={busy} onClick={() => void save()}>Enregistrer</Button></div>
    <div className="space-y-6 p-6">
      {error && <div role="alert" className="rounded border border-ui-border-error p-3 text-ui-fg-error">{error}</div>}
      {notice && <div role="status" className="rounded border p-3">{notice}</div>}
      {loading ? <Text>Chargement de l’identité visuelle…</Text> : loaded && <fieldset disabled={busy || confirmRestore} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">{slots.map(slot => {
          const draft = drafts[slot];
          return <section key={slot} className="space-y-4 rounded-lg border p-4"><Heading level="h2">{labels[slot]}</Heading>
            <div className="flex h-40 items-center justify-center rounded border bg-ui-bg-subtle p-4" style={{ backgroundImage: "linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0", backgroundColor: "#fff" }}>
              {draft.file && draft.mime === "image/svg+xml" ? <Text className="text-black">Validez le SVG pour afficher son aperçu sécurisé.</Text> : <img src={draft.preview || draft.url || defaults[slot]} alt={`Aperçu — ${labels[slot]}`} className="max-h-full max-w-full object-contain" style={slot === "favicon" ? { width: 64, height: 64 } : undefined}/>}
            </div>
            <Text size="small" className="text-ui-fg-subtle">{slot === "favicon" ? "PNG ou ICO · 1 Mo maximum · carré, 16 à 512 pixels. ICO : PNG ou bitmap 24/32 bits." : "PNG, JPG, WebP ou SVG vectoriel simple · 5 Mo maximum · 4096 × 4096 pixels / 16 mégapixels. Sans animation. Les couleurs du logo sont conservées."}</Text>
            <Label htmlFor={`branding-${slot}`}>Importer / remplacer</Label><input ref={node => { inputs.current[slot] = node; }} id={`branding-${slot}`} type="file" accept={slot === "favicon" ? ".png,.ico" : ".png,.jpg,.jpeg,.webp,.svg"} className="block w-full text-sm" onChange={event => select(slot, event.target.files?.[0])}/>
            {draft.file && <Text size="small">{draft.file.name} · en attente d’enregistrement.</Text>}
            {draft.file && draft.mime === "image/svg+xml" && <Button variant="secondary" onClick={() => void previewSvg(slot)}>Valider et prévisualiser le SVG</Button>}
            <Button variant="secondary" disabled={!draft.id && !draft.file} onClick={() => { setDrafts(current => ({ ...current, [slot]: { id: null, url: "" } })); if (inputs.current[slot]) inputs.current[slot]!.value = ""; setDirty(true); setNotice(""); }}>Utiliser l’image par défaut</Button>
          </section>;
        })}</div>
        <Text className="text-ui-fg-subtle">Les SVG sont limités aux formes vectorielles, sans scripts, styles, texte ou ressources externes. Les fichiers validés sont convertis en PNG. Les logos gardent les dimensions d’affichage actuelles du site. Conseil : utilisez un fond transparent.</Text>
        <div className="flex flex-wrap gap-3"><Button disabled={!dirty || needsSvgPreview} isLoading={busy} onClick={() => void save()}>Enregistrer l’identité visuelle</Button><Button variant="secondary" onClick={() => setConfirmRestore(true)}>Restaurer les valeurs par défaut</Button></div>
      </fieldset>}
      {confirmRestore && <section role="alertdialog" aria-modal="false" aria-labelledby="branding-restore-title" className="space-y-3 rounded-lg border p-4"><Heading level="h2" id="branding-restore-title">Restaurer l’identité visuelle par défaut ?</Heading><Text>Les deux logos et le favicon seront remplacés par les images d’origine. Les modifications non enregistrées seront abandonnées. Les fichiers importés resteront conservés.</Text><div className="flex gap-3"><Button variant="danger" isLoading={busy} disabled={busy} onClick={() => void save(true)}>Confirmer la restauration</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirmRestore(false)}>Annuler</Button></div></section>}
    </div>
  </Container>;
};
export const config = defineRouteConfig({ label: "Logo & Identité visuelle", icon: Photo });
export const handle = { breadcrumb: () => "Logo & Identité visuelle" };
export default BrandingPage;
