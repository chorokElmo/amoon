import Link from "next/link";
import { type CatalogItem, formatMad } from "@/lib/catalog-model";
import { catalogImageSource } from "./catalog-image";
import { CatalogCardGallery } from "./catalog-card-gallery";
import { QuickAdd, WishlistButton } from "./product-actions";
export function CatalogCard({ item }: { item: CatalogItem }) {
  const colors = [...new Set(item.variants.flatMap(variant => variant.colors))];
  const sale = item.price !== null && item.originalPrice !== null && item.originalPrice > item.price;
  const href = "/produits/" + encodeURIComponent(item.product.handle) + (item.variants.length === 1 ? "?variante=" + encodeURIComponent(item.variants[0].id) : "");
  const images = [...new Set([item.product.thumbnail, ...item.product.images].map(catalogImageSource).filter((src): src is string => Boolean(src)))];
  const age = Date.now() - item.product.createdAt;
  const badge = sale ? "Prix doux" : item.product.createdAt > 0 && age >= 0 && age < 30 * 86400000 ? "Nouveau" : null;
  return <article className="catalog-card catalog-card--premium"><div className="catalog-photo-wrap"><CatalogCardGallery images={images} title={item.product.title} href={href} badge={badge}/><WishlistButton id={item.product.id} title={item.product.title}/></div><div className="catalog-card-heading"><h2><Link href={href}>{item.product.title}</Link></h2><p className="catalog-price">{item.price !== null ? <>{item.priceVaries && <span>À partir de </span>}{formatMad(item.price)}{sale && <del>{formatMad(item.originalPrice!)}</del>}</> : "Prix indisponible"}</p></div>{colors.length > 0 && <div className="color-options" aria-label="Couleurs disponibles">{colors.map(color=><span key={color} title={color}><span className="color-swatch" style={{backgroundColor:({noir:"#24201f",blanc:"#f1e9df",beige:"#cdb7a2",rose:"#c596a4",bordeaux:"#650f2c",marron:"#76513f"} as Record<string,string>)[color.toLowerCase()]||"#d8cdc4"}}/>{color}</span>)}</div>}<p className={"catalog-stock catalog-stock--" + item.stock}>{item.stock === "in_stock" ? "En stock" : item.stock === "backorder" ? "Sur commande" : item.stock === "out_of_stock" ? "Épuisé" : "Disponibilité à confirmer"}</p><QuickAdd productId={item.product.id} href={href} variants={item.variants}/></article>;
}
