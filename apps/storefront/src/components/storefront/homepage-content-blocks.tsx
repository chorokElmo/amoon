import { getTranslations } from "@/lib/i18n-server";
// Responsive picture sources use the existing public upload URLs.
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { collectionContentHref, type FeaturedCollection, type PromoBanner } from "../../../../medusa/src/lib/homepage-content";
import type { CatalogGroup } from "@/lib/catalog-model";
export async function FeaturedCollections({ items, collections }: { items: FeaturedCollection[]; collections: CatalogGroup[] }) {
  const t = await getTranslations();
  return <>{items.filter(i => i.enabled).map(item => {
    const collection = collections.find(c => c.id === item.collection_id);
    if (!collection) return null;
    return <Link className="shop-story" href={collectionContentHref(collection.handle)} key={item.id}>{item.image ? <Image src={item.image.image_url} alt="" fill sizes="(max-width: 640px) 85vw, 30vw"/> : <div className="homepage-cover-placeholder" aria-hidden="true"/>}<div><h2>{t(item.title)}</h2><p>{t(item.description)}</p><span>{t("Découvrir")}<Icon name="arrow"/></span></div></Link>;
  })}</>;
}
export function PromotionalBanners({ banners }: { banners: PromoBanner[] }) {
  return <div className="homepage-promotions container">{banners.filter(b => b.enabled && b.desktop).map(banner => <section key={banner.id} className="homepage-promotion"><picture>{banner.mobile && <source media="(max-width: 640px)" srcSet={banner.mobile.image_url}/>}<img src={banner.desktop!.image_url} alt="" loading="lazy"/></picture><div className="homepage-promotion-copy"><h2>{banner.title}</h2><p>{banner.subtitle}</p>{banner.url && <Link className="button button--primary" href={banner.url}>{banner.button_text}<Icon name="arrow"/></Link>}</div></section>)}</div>;
}
