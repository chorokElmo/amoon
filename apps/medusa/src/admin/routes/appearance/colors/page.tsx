import { Button, Container, Heading, Input, Label, Prompt, Text } from "@medusajs/ui";
import { useEffect, useRef, useState } from "react";
import { Link, useBlocker } from "react-router-dom";
import { defaultTheme, themeFields, themePresets, themeContrastChecks, readableColor, validHex, type ThemeKey, type ThemePalette } from "../../../../lib/theme-palette";

type ThemeData = { draft: ThemePalette | null; published: ThemePalette | null; revision: number; published_revision: number };
async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { credentials: "include", method: body === undefined ? "GET" : "POST", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(response.status === 401 ? "Votre session a expiré. Reconnectez-vous à l’administration." : data.message || "La demande a échoué. Réessayez.");
  return data;
}
function LivePreview({ colors, logo }: { colors: ThemePalette; logo?: string }) {
  const link = readableColor(colors.primary, colors.background);
  const button = { background: colors.button_background, color: colors.button_text, padding: "12px 18px", borderRadius: 3, border: 0, fontSize: 12, display: "inline-block" };
  return <div aria-label="Aperçu du thème" style={{ background: colors.background, color: colors.text, border: "1px solid #aaa", borderRadius: 8, overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
    <div style={{ background: colors.primary, color: readableColor("#FFFFFF", colors.primary), padding: "7px 12px", textAlign: "center", fontSize: 10 }}>Livraison partout au Maroc</div>
    <header style={{ background: colors.header, padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "space-between", alignItems: "center" }}>{logo ? <img src={logo} alt="Amoon Collection" style={{ width: 110, height: 50, objectFit: "contain" }}/> : <strong style={{ fontFamily: "Georgia, serif", fontSize: 22 }}>Amoon</strong>}<span style={{ fontSize: 11 }}>Accueil · Boutique · Panier</span></header>
    <section style={{ padding: "30px 22px", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(80px,.65fr)", gap: 16, alignItems: "center" }}><div><p style={{ color: link, fontSize: 10, letterSpacing: ".15em" }}>NOUVELLE COLLECTION</p><h2 style={{ fontFamily: "Georgia, serif", fontSize: 27, lineHeight: 1.15, margin: "16px 0" }}>Des pièces qui vous <em style={{ color: link }}>ressemblent.</em></h2><p style={{ fontSize: 12, lineHeight: 1.7 }}>Une élégance qui vous ressemble.</p><span style={button}>Découvrir la collection →</span></div><div aria-hidden="true" style={{ minHeight: 180, borderRadius: "60px 60px 3px 3px", background: colors.secondary, display: "grid", placeItems: "center" }}><svg viewBox="0 0 100 130" width="80" style={{ color: colors.accent }}><path d="M35 15 20 30 5 50 25 62 20 120 80 120 75 62 95 50 80 30 65 15Q50 30 35 15Z" fill="currentColor"/></svg></div></section>
    <section style={{ padding: "10px 22px 26px" }}><h3 style={{ fontFamily: "Georgia, serif", fontSize: 20 }}>Nos nouveautés</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>{["Robe — exemple", "Ensemble — exemple"].map((name, index) => <article key={name} style={{ minWidth: 0, border: `1px solid ${colors.text}`, borderRadius: 5, padding: 10 }}><div aria-hidden="true" style={{ height: 100, background: colors.secondary, display: "grid", placeItems: "center" }}><span style={{ width: 42, height: 75, borderRadius: index ? "10px" : "15px 15px 30px 30px", background: colors.accent }}/></div><p style={{ fontSize: 11 }}>{name}</p><p style={{ fontSize: 12, color: link }}>199 DH</p><span style={{ ...button, display: "block", textAlign: "center", padding: 8 }}>Ajouter au panier</span></article>)}</div></section>
    <footer style={{ background: colors.footer, padding: "20px 22px", fontSize: 11, lineHeight: 1.8 }}><strong>Amoon Collection</strong><p>La boutique · Informations · Contact</p><span>© Amoon. Tous droits réservés.</span></footer>
  </div>;
}
const ThemePage = () => {
  const [colors, setColors] = useState<ThemePalette>({ ...defaultTheme });
  const [saved, setSaved] = useState(JSON.stringify(defaultTheme));
  const [data, setData] = useState<ThemeData>({ draft: null, published: null, revision: 0, published_revision: 0 });
  const [loaded, setLoaded] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [confirmReset, setConfirmReset] = useState(false);
  const [logo, setLogo] = useState<string>();
  const previewRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(colors) !== saved;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !busy && currentLocation.pathname !== nextLocation.pathname);
  const valid = themeFields.every(([key]) => validHex(colors[key]));
  const preview = Object.fromEntries(themeFields.map(([key]) => [key, validHex(colors[key]) ? colors[key] : defaultTheme[key]])) as ThemePalette;
  const checks = themeContrastChecks(preview), accessible = valid && checks.every(check => check.pass);
  const apply = (result: ThemeData) => { const next = result.draft || result.published || { ...defaultTheme }; setData(result); setColors(next); setSaved(JSON.stringify(next)); };
  useEffect(() => {
    let cancelled = false;
    request<ThemeData>("/admin/theme").then(result => { if (!cancelled) { apply(result); setLoaded(true); } }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoading(false); });
    request<{ images: { header_logo?: { url: string } }; defaults: { header_logo: string } }>("/admin/branding").then(result => { if (!cancelled) setLogo(result.images.header_logo?.url || result.defaults.header_logo); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const edit = (key: ThemeKey, value: string) => { setColors(current => ({ ...current, [key]: value.toUpperCase() })); setNotice(""); setError(""); };
  const save = async (action: "draft" | "publish" | "reset") => {
    setBusy(true); setError(""); setNotice("");
    try { const result = await request<ThemeData>("/admin/theme", { action, revision: data.revision, ...(action === "reset" ? {} : { colors }) }); apply(result); setConfirmReset(false); setNotice(action === "draft" ? "Brouillon enregistré. Les couleurs de la boutique n’ont pas changé." : action === "publish" ? "Thème publié. Rechargez la boutique pour découvrir votre nouvelle palette." : "Thème Amoon d’origine restauré sur la boutique."); }
    catch (e) { setError(e instanceof Error ? e.message : "Impossible d’enregistrer le thème."); }
    finally { setBusy(false); }
  };
  return <Container className="p-0"><div className="space-y-2 border-b px-6 py-4"><Link to="/appearance" className="text-sm text-ui-fg-subtle">← Apparence du site</Link><Heading level="h1">Couleurs & Thème</Heading><Text className="text-ui-fg-subtle">Ajustez la palette, vérifiez l’aperçu, puis enregistrez un brouillon ou publiez sur toute la boutique.</Text><Text size="small">{data.published ? `Thème publié · version ${data.published_revision}` : "Thème Amoon d’origine"}{dirty ? " · Modifications non enregistrées" : data.draft ? " · Brouillon enregistré" : ""}</Text></div>
    <div className="space-y-6 p-6">{error && <div role="alert" className="rounded border border-ui-border-error p-3 text-ui-fg-error">{error}</div>}{notice && <div role="status" className="rounded border p-3">{notice}</div>}
      {loading ? <Text>Chargement du thème…</Text> : loaded && <>
        <fieldset disabled={busy || confirmReset} className="space-y-6"><section className="space-y-3"><Heading level="h2">Choisir une inspiration</Heading><div className="flex flex-wrap gap-3">{themePresets.map(preset => <Button key={preset.name} variant="secondary" onClick={() => { setColors({ ...preset.colors }); setNotice(""); setError(""); }}><span className="flex gap-1" aria-hidden="true">{[preset.colors.primary, preset.colors.secondary, preset.colors.background].map((color, index) => <span key={index} className="h-3 w-3 rounded-full border" style={{ background: color }}/>)}</span>{preset.name}</Button>)}</div><Text size="small" className="text-ui-fg-subtle">Choisir un thème modifie seulement l’aperçu. La boutique change après publication.</Text></section>
        <div className="grid items-start gap-6 xl:grid-cols-2"><section className="space-y-4"><Heading level="h2">Votre palette</Heading>{themeFields.map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`theme-${key}`}>{label}</Label><div className="flex items-center gap-3"><input type="color" aria-label={`Choisir — ${label}`} value={validHex(colors[key]) ? colors[key] : defaultTheme[key]} onChange={event => edit(key, event.target.value)} className="h-11 w-14 cursor-pointer rounded border"/><Input id={`theme-${key}`} value={colors[key]} maxLength={7} aria-invalid={!validHex(colors[key])} onChange={event => edit(key, event.target.value)} className="max-w-40 font-mono"/></div>{!validHex(colors[key]) && <Text size="small" className="text-ui-fg-error">Format attendu : #RRGGBB (exemple : #7A0F32).</Text>}</div>)}</section>
          <section className="space-y-3 xl:sticky xl:top-4"><Heading level="h2">Aperçu en direct</Heading><Text size="small" className="text-ui-fg-subtle">Illustration avec des produits d’exemple. Vos images, contenus et prix restent inchangés.</Text><div ref={previewRef}><LivePreview colors={preview} logo={logo}/></div><section className="space-y-2 rounded border p-4"><Heading level="h3">Lisibilité du texte</Heading><Text size="small">Contraste minimum : 4,5:1. Les liens et petits accents textuels sont ajustés automatiquement pour rester lisibles.</Text>{checks.map(check => <Text key={check.label} size="small" className={check.pass ? "text-ui-fg-subtle" : "text-ui-fg-error"}>{check.pass ? "✓" : "⚠"} {check.label} : {check.ratio.toFixed(2)}:1 — {check.pass ? "Conforme" : "À améliorer"}</Text>)}{!accessible && <Text size="small" className="text-ui-fg-error">Améliorez les couleurs indiquées avant publication. Vous pouvez conserver un brouillon avec des contrastes à ajuster.</Text>}</section></section>
        </div><div className="flex flex-wrap gap-3 border-t pt-5"><Button variant="secondary" disabled={!valid || !dirty} onClick={() => void save("draft")}>Enregistrer le brouillon</Button><Button disabled={!accessible} isLoading={busy} onClick={() => void save("publish")}>Publier le thème</Button><Button variant="secondary" onClick={() => setConfirmReset(true)}>Réinitialiser par défaut</Button></div></fieldset>
      </>}
      <Prompt open={confirmReset} onOpenChange={open => { if (!busy) setConfirmReset(open); }} variant="confirmation"><Prompt.Content><Prompt.Header><Prompt.Title>Restaurer le thème Amoon d’origine ?</Prompt.Title><Prompt.Description>Cette action restaure immédiatement les couleurs d’origine et efface le brouillon. Les logos, bannières, produits et commandes restent inchangés.</Prompt.Description></Prompt.Header><Prompt.Footer><Prompt.Cancel disabled={busy} onClick={() => setConfirmReset(false)}>Annuler</Prompt.Cancel><Prompt.Action disabled={busy} onClick={event => { event.preventDefault(); void save("reset"); }}>Confirmer la réinitialisation</Prompt.Action></Prompt.Footer></Prompt.Content></Prompt>
      <Prompt open={blocker.state === "blocked"} variant="confirmation"><Prompt.Content><Prompt.Header><Prompt.Title>Quitter sans enregistrer ?</Prompt.Title><Prompt.Description>Votre palette contient des modifications non enregistrées.</Prompt.Description></Prompt.Header><Prompt.Footer><Prompt.Cancel onClick={() => { if (blocker.state === "blocked") blocker.reset(); }}>Rester sur cette page</Prompt.Cancel><Prompt.Action onClick={() => { if (blocker.state === "blocked") blocker.proceed(); }}>Quitter sans enregistrer</Prompt.Action></Prompt.Footer></Prompt.Content></Prompt>
    </div></Container>;
};
export const handle = { breadcrumb: () => "Couleurs & Thème" };
export default ThemePage;
