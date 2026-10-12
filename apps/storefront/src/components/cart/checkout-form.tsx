"use client";
import { useLanguage, useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Checkout } from "@/lib/medusa-checkout";
import { formatMad } from "@/lib/catalog-model";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { Button, buttonClass } from "@/components/ui/button";
export function CheckoutForm({ initial, unavailable }: { initial: Checkout | null; unavailable: boolean }) {
  const t = useTranslations();
  const { language } = useLanguage();
  const [state, setState] = useState(initial); const [stage, setStage] = useState<"address" | "shipping" | "review">(initial?.review ? "review" : "address");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(unavailable ? "La commande est momentanément indisponible." : ""); const [consent, setConsent] = useState(false); const locked = useRef(false); const router = useRouter();
  const revision = useRef(0);
  const stageContent = useRef<HTMLDivElement>(null);
  const previousStage = useRef(stage);
  useEffect(() => {
    if (previousStage.current !== stage) stageContent.current?.querySelector<HTMLElement>("h2")?.focus();
    previousStage.current = stage;
  }, [stage]);
  useEffect(() => {
    let active = true; const version = revision.current;
    async function refresh() {
      try { const response = await fetch("/api/checkout", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.errorKey || data.error || "Actualisez la commande avant de réessayer."); if (active && revision.current === version) { setState(data.checkout); setStage(data.checkout?.review ? "review" : data.checkout?.customer ? "shipping" : "address"); setError(""); } }
      catch (e) { if (active && revision.current === version) setError(e instanceof Error ? e.message : "Actualisez la commande avant de réessayer."); }
    }
    void refresh(); return () => { active = false; };
  }, [language]);
  async function send(body: unknown, next: "shipping" | "review") {
    if (locked.current) return; locked.current = true; revision.current++; setBusy(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.errorKey || data.error || "Actualisez la commande avant de réessayer.");
      if (data.order) { window.dispatchEvent(new Event("amoon:cart")); router.push("/commande/confirmation"); router.refresh(); }
      else if (data.checkout) { setState(data.checkout); setStage(next); setConsent(false); }
      else throw new Error("Actualisez la commande avant de réessayer.");
    } catch (e) { setError(e instanceof Error ? e.message : "Actualisez la commande avant de réessayer."); }
    finally { locked.current = false; setBusy(false); }
  }
  if (state?.completed) return <section className="container cart-page"><h1>{t("Commande déjà enregistrée")}</h1><p>{t("Retrouvez la confirmation de votre commande sans créer une nouvelle commande.")}</p>{error && <p role="alert">{t(error)}</p>}<Button disabled={busy} onClick={() => void send({ action: "complete", consent: true }, "review")}>{t("Afficher la confirmation")}</Button></section>;
  if (!state || !state.cart.items.length) return <section className="container cart-page"><h1>{t("Votre commande")}</h1>{error ? <div role="alert"><p>{t(error)}</p><a href="/commande" className="text-link">{t("Actualiser")}</a></div> : <p>{t("Ajoutez une pièce au panier pour passer commande.")}</p>}<Link className={buttonClass()} href="/boutique">{t("Découvrir la boutique")}</Link></section>;
  const a = state.customer?.address;
  return <section className="container cart-page"><Link className="text-link" href="/panier">{t("Retour au panier")}</Link><p className="eyebrow">Amoon Collection</p><h1>{t("Votre commande")}</h1><ol className="checkout-progress" aria-label={t("Étapes de la commande")}>{[t("Livraison"), t("Mode de livraison"), t("Vérification & paiement")].map((label, i) => <li key={label} aria-current={i === ["address", "shipping", "review"].indexOf(stage) ? "step" : undefined}>{i + 1}. {t(label)}</li>)}</ol>{error && <div role="alert"><p>{t(error)}</p><a href="/commande" className="text-link">{t("Actualiser et vérifier la commande")}</a></div>}<p role="status">{busy ? t("Mise à jour de votre commande…") : ""}</p>
    <div className="cart-layout"><div ref={stageContent} aria-busy={busy}>
    {stage === "address" && <form className="checkout-fields checkout-customer" onSubmit={event => {
      event.preventDefault(); const f = new FormData(event.currentTarget);
      const address = Object.fromEntries(["phone", "city", "address_1", "address_2"].map(key => [key, String(f.get(key) || "")]));
      void send({ action: "address", customer: { full_name: f.get("full_name"), address } }, "shipping");
    }}><h2 tabIndex={-1}>{t("Vos coordonnées de livraison")}</h2><p>{state.options.length > 0 && state.options.every(option => option.amount === 0) ? t("Livraison gratuite au Maroc.") : t("Livraison au Maroc.")} {t(" Les champs marqués * sont obligatoires.")}</p>
      <label>{t("Nom complet *")}<input name="full_name" autoComplete="name" minLength={2} maxLength={161} defaultValue={[a?.first_name,a?.last_name].filter(Boolean).join(" ")} placeholder={t("Votre nom et prénom")} required disabled={busy}/></label>
      <label>{t("Téléphone *")}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} defaultValue={a?.phone} placeholder="06 XX XX XX XX" required disabled={busy}/></label>
      <label>{t("Ville *")}<input name="city" autoComplete="address-level2" minLength={2} maxLength={80} defaultValue={a?.city} placeholder={t("Votre ville")} required disabled={busy}/></label>
      <label>{t("Adresse de livraison *")}<input name="address_1" autoComplete="address-line1" minLength={5} maxLength={200} defaultValue={a?.address_1} placeholder={t("Quartier, rue, résidence...")} required disabled={busy}/></label>
      <label>{t("Repère / complément ")}<span className="checkout-optional">{t("(facultatif)")}</span><input name="address_2" autoComplete="address-line2" maxLength={200} defaultValue={a?.address_2} placeholder={t("Ex : près de Marjane, 2e étage...")} disabled={busy}/></label>
      <Button type="submit" disabled={busy}>{t("Continuer vers la livraison →")}</Button></form>}
    {stage === "shipping" && <div className="checkout-fields"><h2 tabIndex={-1}>{t("Mode de livraison")}</h2><p>{a?.first_name} {a?.last_name} · {a?.city}</p>{state.options.length ? <form className="checkout-fields" onSubmit={event => { event.preventDefault(); void send({ action: "shipping", optionId: new FormData(event.currentTarget).get("option") }, "review"); }}><fieldset disabled={busy}><legend>{t("Choisir une livraison")}</legend>{state.options.map((option, i) => <label className="checkout-radio" key={option.id}><input type="radio" name="option" value={option.id} defaultChecked={state.selectedShipping ? state.selectedShipping === option.id : i === 0} required/><span>{t(option.name)}</span><strong>{option.amount === 0 ? t("Gratuite") : formatMad(option.amount)}</strong></label>)}</fieldset><Button type="submit" disabled={busy}>{t("Vérifier ma commande")}</Button></form> : <p role="alert">{t("Aucune livraison n’est disponible pour cette adresse. Contactez-nous avant de commander.")}</p>}<Button variant="outline" disabled={busy} onClick={() => setStage("address")}>{t("Modifier mes coordonnées")}</Button></div>}
    {stage === "review" && <div className="checkout-fields"><h2 tabIndex={-1}>{t("Vérifiez votre commande")}</h2><div className="checkout-address"><h3>{t("Livraison")}</h3><p>{a?.first_name} {a?.last_name}<br/>{a?.address_1}<br/>{a?.address_2}{a?.address_2 && <br/>}{a?.city}{t(", Maroc")}<br/><bdi dir="ltr">{a?.phone}</bdi></p><p>{t(state.options.find(o => o.id === state.selectedShipping)?.name || "")}</p></div>{state.cod && <><h3>{t("Paiement à la livraison")}</h3><p>{t("Réglez en espèces à la réception de votre commande. Aucun paiement en ligne n’est demandé.")}</p></>}{!state.cod && <p role="alert">{t("Aucun mode de paiement n’est actuellement disponible. Contactez la boutique.")}</p>}{state.cod && <label className="checkout-radio"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/><span>{t("Je confirme mes coordonnées et ma commande de ")}{formatMad(state.cart.total)}{t(", payable à la livraison.")}</span></label>}<Button disabled={busy || !consent || !state.review || !state.cod} onClick={() => void send({ action: "complete", review: state.review, consent }, "review")}>{busy ? t("Confirmation en cours…") : t("Confirmer ma commande — ") + formatMad(state.cart.total)}</Button><Button variant="outline" disabled={busy} onClick={() => { setStage("address"); setConsent(false); }}>{t("Modifier ma livraison")}</Button></div>}
    </div><aside className="cart-summary"><h2>{t("Votre sélection")}</h2>{state.cart.items.map(item => <div className="checkout-summary-item" key={item.id}><div className="checkout-summary-photo"><CatalogPhoto src={item.thumbnail} alt={item.title} sizes="54px"/></div><div><span>{item.title}</span>{item.variant !== "Default variant" && <small>{item.variant}</small>}<small>{t("Quantité : ")}{item.quantity}</small></div><strong>{formatMad(item.total)}</strong></div>)}<dl><div><dt>{t("Sous-total des articles")}</dt><dd>{formatMad(state.cart.subtotal)}</dd></div>{state.cart.discount > 0 && <div><dt>{t("Réduction")}</dt><dd>−{formatMad(state.cart.discount)}</dd></div>}<div><dt>{t("Taxes calculées")}</dt><dd>{formatMad(state.cart.tax)}</dd></div><div><dt>{t("Livraison")}</dt><dd>{state.selectedShipping ? state.shipping === 0 ? t("Gratuite") : formatMad(state.shipping) : t("À sélectionner")}</dd></div><div className="cart-total"><dt>{t("Total actuel")}</dt><dd>{formatMad(state.cart.total)}</dd></div></dl><Link className="text-link" href="/contact">{t("Besoin d’aide ? Contactez-nous")}</Link></aside></div>
  </section>;
}
