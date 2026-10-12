import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { type CatalogItem, formatMad } from "@/lib/catalog-model";
import { catalogImageSource } from "./catalog-image";
import { CatalogCardGallery } from "./catalog-card-gallery";
import { WishlistButton } from "./product-actions";
import { Icon } from "@/components/ui/icon";
export async function CatalogCard({ item }: { item: CatalogItem }) {
  const t = await getTranslations();
  const colors = [...new Set(item.variants.flatMap(variant => variant.colors))];
  const sale = item.price !== null && item.originalPrice !== null && item.originalPrice > item.price;
  const href = "/produits/" + encodeURIComponent(item.product.handle) + (item.variants.length === 1 ? "?variante=" + encodeURIComponent(item.variants[0].id) : "");
  const images = [...new Set([item.product.thumbnail, ...item.product.images].map(catalogImageSource).filter((src): src is string => Boolean(src)))];
  const age = Date.now() - item.product.createdAt;
  const badge = sale ? t("Promo") : item.product.createdAt > 0 && age >= 0 && age < 30 * 86400000 ? t("Nouveau") : null;
  return <article className="catalog-card catalog-card--premium"><div className="catalog-photo-wrap"><CatalogCardGallery images={images} title={item.product.title} href={href} badge={badge} imageFit={item.product.imageFit}/><WishlistButton id={item.product.id} title={item.product.title}/></div><div className="catalog-card-heading"><h2><Link href={href}>{item.product.title}</Link></h2><p className="catalog-price">{item.price !== null ? <>{item.priceVaries && <span>{t("À partir de ")}</span>}{formatMad(item.price)}{sale && <del>{formatMad(item.originalPrice!)}</del>}</> : t("Prix indisponible")}</p></div>{colors.length > 0 && <div className="color-options" aria-label={t("Couleurs disponibles")}>{colors.map(color=><span key={color} title={t(color)}><span className="color-swatch" style={{backgroundColor:({noir:"#24201f",blanc:"#f1e9df",beige:"#cdb7a2",rose:"#c596a4",bordeaux:"#650f2c",marron:"#76513f"} as Record<string,string>)[color.toLowerCase()]||"#d8cdc4"}}/>{t(color)}</span>)}</div>}<p className={"catalog-stock catalog-stock--" + item.stock}>{item.stock === "in_stock" ? t("En stock") : item.stock === "backorder" ? t("Sur commande") : item.stock === "out_of_stock" ? t("Épuisé") : t("Disponibilité à confirmer")}</p><div className="catalog-card-action"><Link className="button button--outline" href={href} aria-label={t("Voir le produit : ") + item.product.title}>{t("Voir le produit")}<Icon name="arrow"/></Link></div></article>;
}
