import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import { brandSchema, serializeJsonLd, siteOrigin } from "@/lib/seo";
import Link from "next/link";
import { HomepageHero } from "@/components/storefront/homepage-hero";
import type { CSSProperties, ReactNode } from "react";
import { Fragment } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { defaultStoreSettings } from "@/lib/store-settings";
import { getStoreConfig } from "@/lib/store-config";
import { getCatalog } from "@/lib/catalog";
import { fold, parseFilters, selectCatalog } from "@/lib/catalog-model";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { NewsletterForm } from "@/components/storefront/newsletter";
import { newsletterEndpoint } from "@/lib/newsletter-config";
import { Icon } from "@/components/ui/icon";
import { Botanical } from "@/components/storefront/botanical";
import { getStoreHomepageContent } from '@/lib/store-homepage-content';
import { FeaturedCollections, PromotionalBanners } from '@/components/storefront/homepage-content-blocks';
import { defaultHomepageContent, type SectionKey } from '../../../medusa/src/lib/homepage-content';
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata({ title: t("Amoon Collection — Mode féminine au Maroc"), description: t("Découvrez les nouveautés Amoon Collection : vêtements féminins, ensembles et robes. Livraison partout au Maroc et paiement à la livraison."), alternates: { canonical: "/" }, openGraph: { title: "Amoon Collection", url: "/", locale: t("fr_MA"), type: "website" as const, description: t("Découvrez les nouveautés Amoon Collection, boutique de mode féminine au Maroc."), images: [{url:"/images/hero-amoon-rack.png",alt:t("Collection Amoon")}] } }, await getLanguage());
}
export default async function Home() {
  const t = await getTranslations();
  await connection();
  const storeConfig = await getStoreConfig();
  const [catalog, content] = await Promise.all([getCatalog(), getStoreHomepageContent()]);
  const defaults = defaultHomepageContent();
  const section = (key: SectionKey) => content.sections.find(s => s.key === key)!;
  const heading = (key: SectionKey, original: ReactNode) => section(key).heading === defaults.sections.find(s => s.key === key)!.heading ? original : <span style={{whiteSpace:"pre-line"}}>{t(section(key).heading)}</span>;
  const description = (key: SectionKey, original: ReactNode) => section(key).description === defaults.sections.find(s => s.key === key)!.description ? original : <span style={{whiteSpace:"pre-line"}}>{t(section(key).description)}</span>;
  const latest = catalog.ok ? selectCatalog(catalog.data, parseFilters({}), undefined, 4).items : [];
  const categoryHref = (name: string) => { const category = catalog.ok ? catalog.data.categories.find(group => fold(group.name).includes(fold(name))) : null; return category ? "/collections/" + encodeURIComponent(category.handle) : "/boutique?q=" + encodeURIComponent(name); };
  const featured = catalog.ok ? catalog.data.collections.find(group => catalog.data.products.some(product => product.collectionId === group.id)) : null;
  const inspiration = [
    { src: "/images/campaign-wine.png", position: "5% center", alt: t("Silhouette bordeaux") },
    { src: "/images/editorial-wine.png", position: "95% 90%", alt: t("Matières et tons doux") },
    { src: "/images/demo/ensemble.png", position: "center", alt: t("Inspiration ensemble féminin") },
    { src: "/images/editorial-wine.png", position: "85% center", alt: t("Une garde-robe aux tons chauds") },
    { src: "/images/campaign-wine.png", position: "100% center", alt: t("Silhouette en ivoire") },
  ];
  const blocks: Record<SectionKey, ReactNode> = {
    collections: (<>{(section("collections").heading || section("collections").description) && <div className="homepage-section-intro container"><h2>{t(section("collections").heading)}</h2><p>{t(section("collections").description)}</p></div>}    <nav className="shop-stories category-editorial container" aria-label={t("Découvrir nos univers")}>
      {content.collections === null ? <>{[{title:t("Nouveautés"),description:t("La nouvelle sélection Amoon"),href:"/nouveautes",image:"new-arrivals"},{title:t("Ensembles"),description:t("Des looks faciles à porter"),href:categoryHref("Ensembles"),image:"outfits"},{title:t("Robes"),description:t("Des silhouettes féminines"),href:categoryHref("Robes"),image:"dresses"}].map(tile=><Link className="shop-story" href={tile.href} key={t(tile.title)}><Image src={"/images/category-"+tile.image+".png"} alt="" quality={90} fill sizes="(max-width: 640px) 85vw, 30vw"/><div><h2>{t(tile.title)}</h2><p>{t(tile.description)}</p><span>{t("Découvrir")}<Icon name="arrow"/></span></div></Link>)}</> : <FeaturedCollections items={content.collections} collections={catalog.ok ? catalog.data.collections : []}/>}
    </nav></>),
    arrivals: (<section className="home-section container" aria-labelledby="new-title"><div className="section-heading"><div><p className="eyebrow">{t("Un nouveau regard")}</p><h2 id="new-title">{heading("arrivals", t("Les nouveautés"))} <span className="heading-flourish" aria-hidden="true">♡</span></h2></div><Link className="text-link" href="/nouveautes">{t("Voir toutes les nouveautés")}<Icon name="arrow"/></Link></div>{section("arrivals").description && <p className="homepage-section-intro">{t(section("arrivals").description)}</p>}{latest.length ? <div className="product-grid arrivals-grid" style={{"--arrival-columns": Math.max(1, latest.length)} as CSSProperties}>{latest.map(item=><CatalogCard item={item} key={item.product.id}/>)}</div> : <div className="home-catalog-status"><p>{catalog.ok?t("Les nouvelles pièces arrivent bientôt."):t("Le catalogue est temporairement indisponible.")}</p><Link className="text-link" href="/contact">{t("Contacter Amoon")}</Link></div>}</section>),
    season: (<section className="season-campaign" aria-labelledby="season-title"><div className="season-photo"><Image src="/images/editorial-wine.png" alt={t("Inspiration : détails d’une tenue bordeaux et matières douces")} quality={90} fill sizes="(max-width: 640px) 100vw, 50vw"/></div><div className="season-copy"><Botanical/><p className="eyebrow">{t("La collection automne")}</p><h2 id="season-title">{heading("season", <>{t("Des pièces pensées")}<br/><em>{t("pour vous.")}</em></>)}</h2><p>{description("season", <>{t("Découvrez des silhouettes féminines")}<br/>{t("aux lignes élégantes et intemporelles.")}</>)}</p><Link className="button button--primary" href={featured?"/collections/"+encodeURIComponent(featured.handle)+"?univers=collection":"/collections"}>{t("Explorer la collection")}<Icon name="arrow"/></Link></div></section>),
    story: (<section className="brand-story container" aria-labelledby="story-title"><div className="story-copy"><p className="eyebrow">{t("L’esprit Amoon")}</p><h2 id="story-title">{heading("story", <>{t("Moins d’effort.")}<br/><em>{t("Plus d’allure.")}</em></>)}</h2><p>{t(section("story").description)}</p><Link className="button button--outline" href="/contact">{t("En savoir plus")}<Icon name="arrow"/></Link></div><div className="story-photo story-photo--model"><Image src="/images/editorial-wine.png" alt={t("Inspiration : les détails d’une silhouette bordeaux")} quality={90} fill sizes="(max-width: 640px) 50vw, 25vw"/></div><div className="story-photo story-photo--rack"><Image src="/images/editorial-wine.png" alt={t("Inspiration : une sélection de vêtements sur cintres")} quality={90} fill sizes="(max-width: 640px) 50vw, 25vw"/></div><div className="story-photo story-photo--cloth"><Image src="/images/campaign-wine.png" alt={t("Inspiration : pièces ivoire, bordeaux et blush")} quality={90} fill sizes="(max-width: 640px) 100vw, 25vw"/></div></section>),
    trust: (<section className="trust-strip container" aria-label={t("Les engagements Amoon")}>{[{icon:"diamond",title:t("Une mode féminine"),description:t("Des silhouettes élégantes et faciles à porter.")},{icon:"truck",title:t("Livraison au Maroc"),description:t("Dans toutes les villes du Royaume.")},{icon:"exchange",title:t("Échange facile"),description:storeConfig.settings.policies.exchange === defaultStoreSettings().policies.exchange ? t("Sous 7 jours.") : t("Consultez notre politique d’échange.")},{icon:"card",title:storeConfig.settings.payment.cod ? t("Paiement à la livraison") : t("Commande sécurisée"),description:t("Simple et sécurisé.")}].map(item=><div key={item.title}><Icon name={item.icon as "diamond"|"truck"|"exchange"|"card"}/><div><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div></div>)}</section>),
    social: (<section className="social-journal container" aria-labelledby="social-title"><div><p className="eyebrow">{t("Inspiration quotidienne")}</p><h2 id="social-title">{t(section("social").heading)}</h2><a href={storeConfig.instagramUrl || undefined} className="social-handle" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/>{storeConfig.instagramHandle}</a></div><div className="social-mosaic">{inspiration.map((photo,index)=><a href={storeConfig.instagramUrl || undefined} target="_blank" rel="noopener noreferrer" key={index} aria-label={t("Découvrir Amoon sur Instagram")}><Image src={photo.src} alt={t(photo.alt)} quality={90} fill sizes="(max-width: 640px) 32vw, 14vw" style={{objectPosition:photo.position}}/></a>)}</div><a className="button button--outline" href={storeConfig.instagramUrl || undefined} target="_blank" rel="noopener noreferrer">{t("Suivre sur Instagram")}<Icon name="arrow"/></a><p className="social-disclosure">{t(section("social").description)}</p></section>),
    newsletter: (<section className="newsletter newsletter--wine" aria-labelledby="newsletter-title"><Botanical/><div className="container newsletter-inner"><h2 id="newsletter-title">{heading("newsletter", <>{t("Un peu d’Amoon,")}<br/><em>{t("dans votre quotidien.")}</em></>)}</h2><div><p>{t(section("newsletter").description)}</p><NewsletterForm enabled={Boolean(newsletterEndpoint())}/></div></div></section>),
    promotions: (<>{(section("promotions").heading || section("promotions").description) && <div className="homepage-section-intro container"><h2>{t(section("promotions").heading)}</h2><p>{t(section("promotions").description)}</p></div>}<PromotionalBanners banners={content.banners}/></>),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(brandSchema(siteOrigin(process.env.STOREFRONT_URL), await getLanguage()))}}/>
    <HomepageHero/>
    {content.sections.filter(s => s.enabled && (s.key !== "social" || storeConfig.instagramUrl) && (s.key !== "promotions" || content.banners.some(b => b.enabled) || s.heading || s.description)).map(s => <Fragment key={s.key}>{blocks[s.key]}</Fragment>)}
  </>;
}
