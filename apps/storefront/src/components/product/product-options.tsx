"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changeCart } from "@/lib/cart-client";
import { type CatalogProduct, formatMad } from "@/lib/catalog-model";
import { selectedVariant, stockLabel, variantLabel, variantForOptions } from "@/lib/product-model";
import { Icon } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";

export function ProductOptions({ product, initialVariantId, whatsappUrl }: { product: CatalogProduct; initialVariantId?: string; whatsappUrl: string | null }) {
  const t = useTranslations();
  const [variantId, setVariantId] = useState(selectedVariant(product, initialVariantId)?.id || "");
  const [choices, setChoices] = useState<Record<string, string>>(() => Object.fromEntries(selectedVariant(product, initialVariantId)?.options.map(option => [option.name, option.value]) || []));
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const locked = useRef(false);
  const router = useRouter();
  const variant = product.variants.find(item => item.id === variantId) || null;
  const optionNames = [...new Set(product.variants.flatMap(item => item.options.map(option => option.name)))];
  const grouped = optionNames.length > 0 && product.variants.every(item => item.options.length === optionNames.length && optionNames.every(name => item.options.some(option => option.name === name)));
  const prices = product.variants.flatMap(item => item.price === null ? [] : [item.price]);
  const completeChoices = grouped && optionNames.every(name => choices[name]);
  function choose(name: string, value: string) {
    const next = { ...choices, [name]: value };
    setChoices(next);
    const match = variantForOptions(product, next);
    setVariantId(match?.id || "");
    setQuantity(1); setCartMessage(""); setCartError("");
  }
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
  const message = t("Bonjour Amoon Collection, je souhaite des renseignements sur « ") + product.title + " »" + (variant ? " (" + variantLabel(variant, t) + t(", référence ") + (variant.sku || variant.id) + ")" : "") + ".";
  const inquiry = whatsappUrl ? whatsappUrl + "?text=" + encodeURIComponent(message) : "/contact";
  return <div className="product-options">
    <div className="product-selected-summary" aria-live="polite" aria-atomic="true"><p className="product-detail-price">{variant ? variant.price !== null ? <>{formatMad(variant.price)}{sale && <del>{formatMad(variant.originalPrice!)}</del>}</> : t("Prix indisponible") : completeChoices ? t("Combinaison indisponible") : prices.length ? <>{t("À partir de ")}{formatMad(Math.min(...prices))}</> : t("Prix indisponible")}</p>{variant && <><p className={"catalog-stock catalog-stock--" + variant.stock}>{variant.stock === "out_of_stock" ? t("Rupture de stock") : t(stockLabel(variant.stock))}</p>{variant.sku && <p className="product-sku">{t("Référence : ")}{variant.sku}</p>}</>}</div>
    {(product.variants.length > 1 || !variant) && grouped && optionNames.map(name => <fieldset className="pdp-variants" key={name}><legend>{t(name)}{choices[name] && <span> · {t(choices[name])}</span>}</legend><div>{[...new Set(product.variants.flatMap(item => item.options.filter(option => option.name === name).map(option => option.value)))].map(value => <button type="button" key={value} aria-pressed={choices[name] === value} disabled={busy} onClick={() => choose(name, value)}>{t(value)}</button>)}</div></fieldset>)}
    {(!grouped && (product.variants.length > 1 || (product.variants.length === 1 && !variant))) && <fieldset className="pdp-variants"><legend>{t("Choisir votre variante")}</legend><div>{product.variants.map(item => <button type="button" key={item.id} aria-pressed={variantId === item.id} disabled={busy} onClick={() => { setVariantId(item.id); setQuantity(1); setCartMessage(""); setCartError(""); }}>{variantLabel(item, t)}{item.stock === "out_of_stock" ? <small>{t("Épuisé")}</small> : item.stock === "unknown" ? <small>{t("À confirmer")}</small> : null}</button>)}</div></fieldset>}    {product.variants.length === 0 && <p>{t("Aucune variante n’est disponible pour cette pièce.")}</p>}
    {variant && product.variants.length === 1 && variant.options.some(option => option.name.toLowerCase() !== "default option") && <dl className="product-variant-details">{variant.options.map((option, index) => <div key={index}><dt>{t(option.name)}</dt><dd>{t(option.value)}</dd></div>)}</dl>}
    <div className="product-cart"><label htmlFor="product-quantity">{t("Quantité")}</label><div className="pdp-quantity"><button type="button" aria-label={t("Diminuer la quantité")} disabled={busy || !purchasable || quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input id="product-quantity" type="number" min={1} max={maxQuantity} step={1} value={quantity} disabled={busy || !purchasable} onChange={event => setQuantity(Number(event.target.value))}/><button type="button" aria-label={t("Augmenter la quantité")} disabled={busy || !purchasable || quantity >= maxQuantity} onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}>+</button></div><div className={"product-cart-actions" + (purchasable ? " product-cart-actions--sticky" : "")}><button type="button" className={buttonClass()} disabled={busy || !purchasable || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity} onClick={() => void add()}><Icon name="bag"/>{busy ? t("Ajout en cours…") : t("Ajouter au panier")}</button><p className="product-cart-confirmation" role="status" aria-live="polite">{t(cartMessage)}</p>{cartError && <p role="alert">{t(cartError)} <Link href="/panier">{t("Voir le panier")}</Link></p>}{cartMessage && <Link className="text-link" href="/panier">{t("Voir le panier")}</Link>}</div></div>
    {purchasable && <button type="button" className={buttonClass("outline") + " product-inquiry"} disabled={busy || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity} onClick={() => void add(true)}>{t("Commander maintenant")}</button>}
    <Link className="text-link product-contact" href={inquiry}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H6l-4 3 1-7a8 8 0 1 1 17-4Z"/></svg>{whatsappUrl ? t("Demander conseil sur WhatsApp") : variant?.stock === "out_of_stock" ? t("Demander une disponibilité") : t("Un conseil sur cette pièce ? Contactez-nous")}</Link>
    {!purchasable && <p className="product-purchase-note">{variant ? t("Cette pièce n’est pas disponible à la commande pour le moment. Contactez-nous pour en savoir plus.") : completeChoices ? t("Cette combinaison n’est pas proposée. Choisissez une autre option.") : product.variants.length ? t("Sélectionnez votre variante pour découvrir son prix et sa disponibilité.") : t("Cette pièce n’est pas disponible à la commande pour le moment.")}</p>}
  </div>;
}
