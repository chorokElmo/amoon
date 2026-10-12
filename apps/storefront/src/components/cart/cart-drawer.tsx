"use client";
import { useLanguage, useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type Cart, type CartAction } from "@/lib/medusa-cart";
import { changeCart } from "@/lib/cart-client";
import { formatMad } from "@/lib/catalog-model";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { buttonClass } from "@/components/ui/button";

export function CartDrawer({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations();
  const { language } = useLanguage();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    fetch("/api/cart", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.errorKey || data.error || "Votre panier est momentanément indisponible.");
      if (active) setCart(data.cart);
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "Le panier est indisponible."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);
  async function mutate(action: CartAction) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try { setCart(await changeCart(action)); setNotice(action.action === "remove" ? "Article retiré." : "Quantité mise à jour."); }
    catch (error) { setError(error instanceof Error ? error.message : "Veuillez réessayer."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="cart-drawer" aria-busy={loading || busy}>
    <p role="status" className="drawer-status">{loading ? t("Chargement de votre panier…") : t(notice)}</p>
    {error && <p role="alert">{t(error)} <Link href="/panier" onClick={onNavigate}>{t("Ouvrir le panier")}</Link></p>}
    {!loading && !error && (!cart || !cart.items.length) && <div className="drawer-empty"><span aria-hidden="true">a.</span><h3>{t("Votre prochaine pièce")}<br/>{t("vous attend.")}</h3><p>{t("Votre panier est encore vide.")}</p><Link href="/boutique" className={buttonClass()} onClick={onNavigate}>{t("Explorer la boutique")}</Link></div>}
    {cart && cart.items.length > 0 && <><div className="drawer-items">{cart.items.map(item => <article className="drawer-item" key={item.id}><div className="drawer-photo"><CatalogPhoto src={item.thumbnail} alt={item.title} sizes="90px"/></div><div><Link href={item.handle ? "/produits/" + encodeURIComponent(item.handle) : "/boutique"} onClick={onNavigate}><h3>{item.title}</h3></Link>{item.variant !== "Default variant" && <p>{item.variant}</p>}<p>{formatMad(item.unitPrice)}</p><div className="cart-item-controls"><button type="button" disabled={busy || item.quantity <= 1} aria-label={t("Diminuer la quantité de ") + item.title} onClick={() => void mutate({ action: "update", itemId: item.id, quantity: item.quantity - 1 })}>−</button><output>{item.quantity}</output><button type="button" disabled={busy || item.quantity >= 99} aria-label={t("Augmenter la quantité de ") + item.title} onClick={() => void mutate({ action: "update", itemId: item.id, quantity: item.quantity + 1 })}>+</button><button type="button" className="text-link" disabled={busy} aria-label={t("Retirer ") + item.title} onClick={() => void mutate({ action: "remove", itemId: item.id })}>{t("Retirer")}</button></div></div></article>)}</div><div className="drawer-summary"><dl><div><dt>{t("Sous-total")}</dt><dd>{formatMad(cart.subtotal)}</dd></div>{cart.discount > 0 && <div><dt>{t("Réduction")}</dt><dd>−{formatMad(cart.discount)}</dd></div>}<div><dt>{t("Livraison")}</dt><dd>{t("Calculée à la commande")}</dd></div><div><dt>{t("Total actuel")}</dt><dd>{formatMad(cart.total)}</dd></div></dl><Link href="/commande" className={buttonClass()} aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); else onNavigate(); }}>{t("Passer la commande")}</Link><Link href="/panier" className="text-link" onClick={onNavigate}>{t("Voir mon panier")}</Link></div></>}
  </div>;
}
