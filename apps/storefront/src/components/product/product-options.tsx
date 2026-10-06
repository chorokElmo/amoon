"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changeCart } from "@/lib/cart-client";
import { type CatalogProduct, formatMad } from "@/lib/catalog-model";
import { selectedVariant, stockLabel, variantLabel } from "@/lib/product-model";
import { Sheet } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";

export function ProductOptions({ product, initialVariantId, whatsappUrl }: { product: CatalogProduct; initialVariantId?: string; whatsappUrl: string | null }) {
  const [variantId, setVariantId] = useState(selectedVariant(product, initialVariantId)?.id || "");
  const [guide, setGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const locked = useRef(false);
  const router = useRouter();
  const variant = product.variants.find(item => item.id === variantId) || null;
  const maxQuantity = Math.min(99, variant?.maxQuantity ?? 99);
  const purchasable = variant?.price !== null && variant?.price !== undefined && ["in_stock", "backorder"].includes(variant.stock);
  async function add(checkout = false) {
    if (!variant || !purchasable || locked.current || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return;
    locked.current = true; setBusy(true); setCartError(""); setCartMessage("");
    try { await changeCart({ action: "add", productId: product.id, variantId: variant.id, quantity }); setCartMessage("Article ajouté à votre panier."); if (checkout) router.push("/commande"); }
    catch (error) { setCartError(error instanceof Error ? error.message : "Actualisez le panier avant de réessayer."); }
    finally { locked.current = false; setBusy(false); }
  }
  const sale = variant?.price !== null && variant?.price !== undefined && variant.originalPrice !== null && variant.originalPrice > variant.price;
  const message = "Bonjour Amoon Collection, je souhaite des renseignements sur « " + product.title + " »" + (variant ? " (" + variantLabel(variant) + ", référence " + (variant.sku || variant.id) + ")" : "") + ".";
  const inquiry = whatsappUrl ? whatsappUrl + "?text=" + encodeURIComponent(message) : "/contact";
  return <div className="product-options">
    <div className="product-selected-summary" aria-live="polite" aria-atomic="true"><p className="product-detail-price">{variant ? variant.price !== null ? <>{formatMad(variant.price)}{sale && <del>{formatMad(variant.originalPrice!)}</del>}</> : "Prix indisponible" : "Sélectionnez une variante pour voir son prix."}</p>{variant && <><p className={"catalog-stock catalog-stock--" + variant.stock}>{variant.stock === "out_of_stock" ? "Rupture de stock" : stockLabel(variant.stock)}</p>{variant.sku && <p className="product-sku">Référence : {variant.sku}</p>}</>}</div>
    {(product.variants.length > 1 || (product.variants.length === 1 && !variant)) && <fieldset className="pdp-variants"><legend>Choisir votre variante</legend><div>{product.variants.map(item => <button type="button" key={item.id} aria-pressed={variantId === item.id} disabled={busy || item.stock === "out_of_stock" || item.stock === "unknown"} onClick={() => { setVariantId(item.id); setQuantity(1); setCartMessage(""); setCartError(""); }}>{variantLabel(item)}{item.stock === "out_of_stock" && <small>Épuisé</small>}</button>)}</div></fieldset>}    {product.variants.length === 0 && <p>Aucune variante n’est disponible pour cette pièce.</p>}
    {variant && product.variants.length === 1 && variant.options.some(option => option.name.toLowerCase() !== "default option") && <dl className="product-variant-details">{variant.options.map((option, index) => <div key={index}><dt>{option.name}</dt><dd>{option.value}</dd></div>)}</dl>}
    <button className="text-link product-guide-button" type="button" onClick={() => setGuide(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m3 16 13-13 5 5L8 21 3 16Zm5-5 2 2m1-5 2 2m1-5 2 2"/></svg>Guide des tailles</button>
    <div className="product-cart"><label htmlFor="product-quantity">Quantité</label><div className="pdp-quantity"><button type="button" aria-label="Diminuer la quantité" disabled={busy || !purchasable || quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input id="product-quantity" type="number" min={1} max={maxQuantity} step={1} value={quantity} disabled={busy || !purchasable} onChange={event => setQuantity(Number(event.target.value))}/><button type="button" aria-label="Augmenter la quantité" disabled={busy || !purchasable || quantity >= maxQuantity} onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}>+</button></div><button type="button" className={buttonClass()} disabled={busy || !purchasable || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity} onClick={() => void add()}><Icon name="bag"/>{busy ? "Ajout en cours…" : "Ajouter au panier"}</button><p role="status">{cartMessage}</p>{cartError && <p role="alert">{cartError} <Link href="/panier">Voir le panier</Link></p>}{cartMessage && <Link className="text-link" href="/panier">Voir le panier</Link>}</div>
    {purchasable && <button type="button" className={buttonClass("outline") + " product-inquiry"} disabled={busy || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity} onClick={() => void add(true)}>Commander maintenant</button>}
    <Link className="text-link product-contact" href={inquiry}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H6l-4 3 1-7a8 8 0 1 1 17-4Z"/></svg>{variant?.stock === "out_of_stock" ? "Demander une disponibilité" : "Un conseil sur cette pièce ? Contactez-nous"}</Link>
    {!purchasable && <p className="product-purchase-note">{variant ? "Cette pièce n’est pas disponible à la commande pour le moment. Contactez-nous pour en savoir plus." : "Sélectionnez votre variante pour découvrir son prix et sa disponibilité."}</p>}
    <Sheet open={guide} onClose={() => setGuide(false)} title="Guide des tailles" kind="search">{product.sizeGuide ? <p className="product-plain-text">{product.sizeGuide}</p> : <><p className="product-plain-text">Les mesures de cette pièce ne sont pas encore renseignées.</p><p className="product-plain-text">Contactez-nous pour connaître ses dimensions et choisir la taille qui vous convient.</p></>}<Link className="text-link" href={inquiry}>Demander conseil</Link></Sheet>
  </div>;
}
