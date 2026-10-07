import { catalogMetadata } from "@/lib/seo";
import Link from "next/link";
import { connection } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { descendantIds } from "@/lib/catalog-model";
import { CatalogImage } from "@/components/catalog/catalog-image";
import { CatalogStatus } from "@/components/catalog/catalog-status";
import { Icon } from "@/components/ui/icon";
export const metadata = catalogMetadata("Collections de mode féminine", "Découvrez les collections Amoon : vêtements féminins, ensembles et robes pour composer votre garde-robe au Maroc.", "/collections", {});
export default async function Collections() {
  await connection();
  const result = await getCatalog();
  if (!result.ok) return <CatalogStatus title="Nos collections" action="/collections"/>;
  const { data } = result;
  return <div className="collection-index container"><p className="eyebrow">À chacune son allure</p><h1>Nos collections</h1><p>Des univers à explorer, des pièces à faire vôtres.</p>{[{ title: "Par catégorie", groups: data.categories, category: true }, { title: "Les collections Amoon", groups: data.collections, category: false }].map(section => section.groups.length > 0 && <section key={section.title} aria-label={section.title}><h2>{section.title}</h2><div className="collection-index-grid">{section.groups.map(group => {
    const ids = descendantIds(data.categories, group.id);
    const products = data.products.filter(product => section.category ? product.categoryIds.some(id => ids.has(id)) : product.collectionId === group.id);
    // When a collection handle overlaps a category, use an explicit collection query.
    const collision = !section.category && data.categories.some(category => category.handle === group.handle);
    return <Link key={group.id} href={"/collections/" + encodeURIComponent(group.handle) + (collision ? "?univers=collection" : "")} className="collection-index-card"><div className="collection-index-image"><CatalogImage src={products.find(product => product.thumbnail)?.thumbnail || null} alt={group.name} sizes="(max-width: 640px) 100vw, 30vw"/></div><div><h3>{group.name}</h3><Icon name="arrow"/></div><p>{products.length} {products.length === 1 ? "pièce" : "pièces"}</p></Link>;
  })}</div></section>)}{data.categories.length + data.collections.length === 0 && <p className="catalog-empty">Nos collections seront dévoilées prochainement.</p>}</div>;
}
