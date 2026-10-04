"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { changeCart } from "@/lib/cart-client";
import { type CatalogProduct, formatMad } from "@/lib/catalog-model";
import { selectedVariant, stockLabel, variantLabel } from "@/lib/product-model";
import { Sheet } from "@/components/ui/sheet";
import { buttonClass } from "@/components/ui/button";

export function ProductOptions({ product, initialVariantId, whatsappUrl }: { product: CatalogProduct; initialVariantId?: string; whatsappUrl: string | null }) {
  const [variantId, setVariantId] = useState(selectedVariant(product, initialVariantId)?.id || "");
  const [guide, setGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const locked = useRef(false);
  const variant = product.variants.find(item => item.id === variantId) || null;
  const purchasable = variant?.price !== null && variant?.price !== undefined && ["in_stock", "backorder"].includes(variant.stock);
  async function add() {
    if (!variant || !purchasable || locked.current) return;
    locked.current = true; setBusy(true); setCartError(""); setCartMessage("");
    try { await changeCart({ action: "add", productId: product.id, variantId: variant.id, quantity }); setCartMessage("Article ajouté à votre panier."); }
    catch (error) { setCartError(error instanceof Error ? error.message : "Actualisez le panier avant de réessayer."); }
    finally { locked.current = false; setBusy(false); }
  }
  const sale = variant?.price !== null && variant?.price !== undefined && variant.originalPrice !== null && variant.originalPrice > variant.price;
  const message = "Bonjour Amoon Collection, je souhaite des renseignements sur « " + product.title + " »" + (variant ? " (" + variantLabel(variant) + ", référence " + (variant.sku || variant.id) + ")" : "") + ".";
  const inquiry = whatsappUrl ? whatsappUrl + "?text=" + encodeURIComponent(message) : "/contact";
  return <div className="product-options">
    <div className="product-selected-summary" aria-live="polite" aria-atomic="true"><p className="product-detail-price">{variant ? variant.price !== null ? <>{formatMad(variant.price)}{sale && <del>{formatMad(variant.originalPrice!)}</del>}</> : "Prix indisponible" : "Sélectionnez une variante pour voir son prix."}</p>{variant && <><p className={"catalog-stock catalog-stock--" + variant.stock}>{stockLabel(variant.stock)}</p>{variant.sku && <p className="product-sku">Référence : {variant.sku}</p>}</>}</div>
    {(product.variants.length > 1 || (product.variants.length === 1 && !variant)) && <div className="product-variant-choice"><label htmlFor="product-variant">Choisir une variante</label><select id="product-variant" disabled={busy} value={variantId} onChange={event => { setVariantId(event.target.value); setCartMessage(""); setCartError(""); }}><option value="">Sélectionner</option>{product.variants.map(item => <option key={item.id} value={item.id}>{variantLabel(item)} — {stockLabel(item.stock)}</option>)}</select></div>}
    {product.variants.length === 0 && <p>Aucune variante n’est disponible pour cette pièce.</p>}
    {variant && product.variants.length === 1 && variant.options.some(option => option.name.toLowerCase() !== "default option") && <dl className="product-variant-details">{variant.options.map((option, index) => <div key={index}><dt>{option.name}</dt><dd>{option.value}</dd></div>)}</dl>}
    <button className="text-link product-guide-button" type="button" onClick={() => setGuide(true)}>Guide des tailles</button>
    <div className="product-cart"><label htmlFor="product-quantity">Quantité</label><input id="product-quantity" type="number" min={1} max={99} step={1} value={quantity} disabled={busy || !purchasable} onChange={event => setQuantity(Number(event.target.value))}/><button type="button" className={buttonClass()} disabled={busy || !purchasable || !Number.isInteger(quantity) || quantity < 1 || quantity > 99} onClick={() => void add()}>{busy ? "Ajout en cours…" : "Ajouter au panier"}</button><p role="status">{cartMessage}</p>{cartError && <p role="alert">{cartError} <Link href="/panier">Voir le panier</Link></p>}{cartMessage && <Link className="text-link" href="/panier">Voir le panier</Link>}</div>
    <Link className={buttonClass() + " product-inquiry"} href={inquiry}>{variant?.stock === "out_of_stock" ? "Demander une disponibilité" : "Se renseigner sur cette pièce"}</Link>
    {!purchasable && <p className="product-purchase-note">Choisissez une variante avec un prix en MAD et une disponibilité confirmée pour l’ajouter au panier.</p>}
    <Sheet open={guide} onClose={() => setGuide(false)} title="Guide des tailles" kind="search">{product.sizeGuide ? <p className="product-plain-text">{product.sizeGuide}</p> : <><p className="product-plain-text">Les mesures de cette pièce ne sont pas encore renseignées.</p><p className="product-plain-text">Contactez-nous pour connaître ses dimensions et choisir la taille qui vous convient.</p></>}<Link className="text-link" href={inquiry}>Demander conseil</Link></Sheet>
  </div>;
}
