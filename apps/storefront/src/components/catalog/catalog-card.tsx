import Link from "next/link";
import { type CatalogItem, formatMad } from "@/lib/catalog-model";
import { storeConfig } from "@/lib/store-config";
import { CatalogImage } from "./catalog-image";
export function CatalogCard({ item }: { item: CatalogItem }) {
  const colors = [...new Set(item.variants.flatMap(variant => variant.colors))];
  const sale = item.price !== null && item.originalPrice !== null && item.originalPrice > item.price;
  const href = "/produits/" + encodeURIComponent(item.product.handle) + (item.variants.length === 1 ? "?variante=" + encodeURIComponent(item.variants[0].id) : "");
  return <article className="catalog-card"><Link className="catalog-product-link" href={href} aria-label={"Voir " + item.product.title}><div className="product-image"><CatalogImage src={item.product.thumbnail} alt={item.product.title}/>{sale && <span className="product-label">Prix doux</span>}</div></Link><div className="catalog-card-heading"><h2><Link href={href}>{item.product.title}</Link></h2><p className="catalog-price">{item.price !== null ? <>{item.priceVaries && <span>À partir de </span>}{formatMad(item.price)}{sale && <del>{formatMad(item.originalPrice!)}</del>}</> : "Prix indisponible"}</p></div>{colors.length > 0 && <p className="catalog-colors">{colors.slice(0, 3).join(" · ")}{colors.length > 3 ? " +" + (colors.length - 3) : ""}</p>}<p className={"catalog-stock catalog-stock--" + item.stock}>{item.stock === "in_stock" ? "En stock" : item.stock === "backorder" ? "Sur commande" : item.stock === "out_of_stock" ? "Épuisé" : "Disponibilité à confirmer"}</p><Link className="catalog-enquiry" href={storeConfig.whatsappUrl ? storeConfig.whatsappUrl + "?text=" + encodeURIComponent("Bonjour Amoon Collection, je souhaite des renseignements sur « " + item.product.title + " ».") : "/contact"}>Se renseigner sur cette pièce<span className="sr-only"> : {item.product.title}</span></Link></article>;
}
