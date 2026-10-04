"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type Cart, type CartAction } from "@/lib/medusa-cart";
import { changeCart } from "@/lib/cart-client";
import { formatMad } from "@/lib/catalog-model";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { buttonClass } from "@/components/ui/button";
export function CartView({ initialCart, unavailable }: { initialCart: Cart | null; unavailable: boolean }) {
  const [cart, setCart] = useState(initialCart); const [busy, setBusy] = useState(false); const [error, setError] = useState(unavailable ? "Votre panier est momentanément indisponible." : ""); const [notice, setNotice] = useState(""); const locked = useRef(false);
  const [available, setAvailable] = useState(!unavailable);
  const revision = useRef(0);
  useEffect(() => {
    let active = true; const version = revision.current;
    // Resync after navigation so a prefetched page cannot restore an older cart.
    async function refresh() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" }); const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Votre panier est momentanément indisponible.");
        if (active && version === revision.current) { setCart(data.cart); setAvailable(true); setError(""); }
      } catch (e) { if (active && version === revision.current) setError(e instanceof Error ? e.message : "Actualisez le panier avant de réessayer."); }
    }
    void refresh(); return () => { active = false; };
  }, []);
  async function mutate(action: CartAction) {
    if (locked.current) return; locked.current = true; revision.current++; setBusy(true); setError(""); setNotice("");
    try { setCart(await changeCart(action)); setNotice(action.action === "remove" ? "Article retiré du panier." : "Quantité mise à jour."); }
    catch (e) { setError(e instanceof Error ? e.message : "Actualisez le panier avant de réessayer."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <section className="container cart-page"><p className="eyebrow">Amoon Collection</p><h1>Votre panier</h1><p role="status" aria-live="polite">{notice}{busy && " Mise à jour…"}</p>{error && <div role="alert"><p>{error}</p><a className="text-link" href="/panier">Actualiser le panier</a></div>}
    {available && (!cart || cart.items.length === 0) ? <div className="cart-empty"><p>Votre panier est vide.</p><Link className={buttonClass()} href="/boutique">Découvrir la boutique</Link></div> : cart && <div className="cart-layout"><div className="cart-items" aria-busy={busy}>{cart.items.map(item => <article className="cart-item" key={item.id}><div className="cart-item-photo"><CatalogPhoto src={item.thumbnail} alt={item.title} sizes="110px"/></div><div className="cart-item-details"><Link href={item.handle ? "/produits/" + encodeURIComponent(item.handle) + "?variante=" + encodeURIComponent(item.variantId) : "/boutique"}><h2>{item.title}</h2></Link>{item.variant && item.variant !== "Default variant" && <p>{item.variant}</p>}<p>{formatMad(item.unitPrice)} / pièce</p><div className="cart-item-controls"><button type="button" disabled={busy || item.quantity <= 1} aria-label={"Diminuer la quantité de " + item.title} onClick={() => void mutate({ action: "update", itemId: item.id, quantity: item.quantity - 1 })}>−</button><output aria-label={"Quantité de " + item.title}>{item.quantity}</output><button type="button" disabled={busy || item.quantity >= 99} aria-label={"Augmenter la quantité de " + item.title} onClick={() => void mutate({ action: "update", itemId: item.id, quantity: item.quantity + 1 })}>+</button><button type="button" className="text-link" disabled={busy} aria-label={"Retirer " + item.title + " du panier"} onClick={() => void mutate({ action: "remove", itemId: item.id })}>Retirer</button></div></div><strong className="cart-line-total">{formatMad(item.total)}</strong></article>)}</div><aside className="cart-summary"><h2>Récapitulatif</h2><dl><div><dt>Sous-total des articles</dt><dd>{formatMad(cart.subtotal)}</dd></div>{cart.discount > 0 && <div><dt>Réduction</dt><dd>−{formatMad(cart.discount)}</dd></div>}<div><dt>Taxes calculées</dt><dd>{formatMad(cart.tax)}</dd></div><div className="cart-total"><dt>Total actuel</dt><dd>{formatMad(cart.total)}</dd></div></dl><p>Les frais de livraison seront calculés au moment de la commande.</p><Link className={buttonClass()} href="/commande" aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); }}>Passer commande</Link><Link className="text-link" href="/contact">Contacter Amoon Collection</Link><Link className="text-link" href="/boutique">Continuer mes achats</Link></aside></div>}
  </section>;
}
