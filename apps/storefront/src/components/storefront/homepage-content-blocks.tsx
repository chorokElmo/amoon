import { getTranslations } from "@/lib/i18n-server";
// Responsive picture sources use the existing public upload URLs.
import Link from "next/link";
import { CatalogImage, catalogImageSource } from "@/components/catalog/catalog-image";
import { Icon } from "@/components/ui/icon";
import { collectionContentHref, type FeaturedCollection, type PromoBanner } from "../../../../medusa/src/lib/homepage-content";
import type { CatalogGroup, CatalogProduct } from "@/lib/catalog-model";
export async function FeaturedCollections({ items, collections, products }: { items: FeaturedCollection[]; collections: CatalogGroup[]; products: CatalogProduct[] }) {
  const t = await getTranslations();
  return <>{items.filter(i => i.enabled).map(item => {
    const collection = collections.find(c => c.id === item.collection_id);
    if (!collection) return null;
    const members = products.filter(product => product.collectionId === collection.id);
    const image = catalogImageSource(item.image?.image_url || null) || members.flatMap(product => product.images).map(catalogImageSource).find(Boolean);
    if (!members.length || !image) return null;
    return <Link className="shop-story" href={collectionContentHref(collection.handle)} key={item.id}><CatalogImage src={image} alt="" sizes="(max-width: 640px) 45vw, 25vw"/><div><h2>{t(item.title)}</h2><p>{t(item.description)}</p><span>{t("Découvrir")}<Icon name="arrow"/></span></div></Link>;
  })}</>;
}
export async function PromotionalBanners({ banners }: { banners: PromoBanner[] }) {
  const t = await getTranslations();
  return <div className="homepage-promotions container">{banners.filter(b => b.enabled && b.desktop).map(banner => <section key={banner.id} className="homepage-promotion"><picture>{banner.mobile && <source media="(max-width: 640px)" srcSet={banner.mobile.image_url}/>}<img src={banner.desktop!.image_url} alt="" loading="lazy"/></picture><div className="homepage-promotion-copy"><h2>{t(banner.title)}</h2><p>{t(banner.subtitle)}</p>{banner.url && <Link className="button button--primary" href={banner.url}>{t(banner.button_text)}<Icon name="arrow"/></Link>}</div></section>)}</div>;
}
