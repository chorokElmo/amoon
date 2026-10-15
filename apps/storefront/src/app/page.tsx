import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import { brandSchema, serializeJsonLd, siteOrigin } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { HomepageHero } from "@/components/storefront/homepage-hero";
import { Fragment, type CSSProperties } from "react";
import { connection } from "next/server";
import { defaultStoreSettings, readStoreSettings } from "@/lib/store-settings";
import { getStoreConfig } from "@/lib/store-config";
import { getCatalog } from "@/lib/catalog";
import { categoryTree, descendantIds, homepageArrivals } from "@/lib/catalog-model";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { CatalogImage, catalogImageSource } from "@/components/catalog/catalog-image";
import { NewsletterForm } from "@/components/storefront/newsletter";
import { newsletterEndpoint } from "@/lib/newsletter-config";
import { Icon } from "@/components/ui/icon";
import { getStoreHomepageContent } from "@/lib/store-homepage-content";
import { FeaturedCollections, PromotionalBanners } from "@/components/storefront/homepage-content-blocks";
import { defaultHomepageContent, type SectionKey } from "../../../medusa/src/lib/homepage-content";
import styles from "./homepage.module.css";
import editorial from "../../public/images/editorial/hijab-portrait.webp";

// Licensed inspiration photographs; product images and associations remain in Medusa.
const categoryPhotography: Record<string, { src: string; alt: string }> = {
  robes: { src: "/images/editorial/hijab-beach.webp", alt: "Inspiration robes : une femme en hijab et robe longue sur la plage." },
  "chemises-tops": { src: "/images/editorial/hijab-white-shirt.webp", alt: "Inspiration tops : une femme en hijab beige et chemise blanche." },
  ensembles: { src: "/images/editorial/hijab-tailoring.webp", alt: "Inspiration ensembles : une femme en hijab noir et manteau beige ceinturé." },
  "jupes-pantalons": { src: "/images/editorial/hijab-casual.webp", alt: "Inspiration pantalons : une femme en hijab beige et jean, en extérieur." },
};
export async function generateMetadata() {
  const t = await getTranslations();
  const catalog = await getCatalog();
  const image = catalog.ok ? catalogImageSource(catalog.data.products[0]?.thumbnail || null) : null;
  return localizeMetadata({ title: t("Amoon Collection — Mode féminine au Maroc"), description: t("Découvrez Amoon Collection : robes, ensembles et pièces féminines pour une élégance au quotidien au Maroc."), alternates: { canonical: "/" }, openGraph: { title: "Amoon Collection", url: "/", locale: t("fr_MA"), type: "website" as const, description: t("Découvrez les nouveautés Amoon Collection, boutique de mode féminine au Maroc."), images: image ? [{url:image,alt:t("Collection Amoon")}] : [] } }, await getLanguage());
}
export default async function Home() {
  const t = await getTranslations();
  await connection();
  const [storeConfig, catalog, content, merchantSettings] = await Promise.all([getStoreConfig(), getCatalog(), getStoreHomepageContent(), readStoreSettings({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY }).catch(() => null)]);
  const defaults = defaultHomepageContent();
  const section = (key: SectionKey) => content.sections.find(s => s.key === key)!;
  const heading = (key: SectionKey, fallback: string) => t(section(key).heading === defaults.sections.find(s => s.key === key)!.heading ? fallback : section(key).heading);
  const latest = catalog.ok ? homepageArrivals(catalog.data) : [];
  const availableProducts = catalog.ok ? catalog.data.products.filter(product => product.variants.some(variant => variant.stock === "in_stock")) : [];
  const featuredCollections = content.collections?.filter(item => item.enabled && catalog.ok && catalog.data.collections.some(collection => collection.id === item.collection_id) && availableProducts.some(product => product.collectionId === item.collection_id)) || [];
  const newsletterEnabled = Boolean(newsletterEndpoint());
  const categoryCards = catalog.ok ? categoryTree(catalog.data.categories).flatMap(category => {
    const ids = descendantIds(catalog.data.categories, category.id);
    const product = availableProducts.find(product => product.categoryIds.some(id => ids.has(id)) && catalogImageSource(product.thumbnail));
    const photograph = categoryPhotography[category.handle];
    return product ? [{ id:category.id, title:category.name, image:photograph?.src || product.thumbnail, alt:photograph?.alt || product.title, href:"/collections/" + encodeURIComponent(category.handle) }] : [];
  }).slice(0,4) : [];
  const blocks: Record<SectionKey, React.ReactNode> = {
    collections: <section className="home-section container"><div className="section-heading"><div><p className="eyebrow">{t("Nos catégories")}</p><h2>{heading("collections", "Découvrez nos collections")}</h2></div><Link className="text-link" href="/collections">{t("Voir toutes les catégories")}<Icon name="arrow"/></Link></div>{section("collections").description && <p>{t(section("collections").description)}</p>}<nav className="shop-stories category-editorial" aria-label={t("Découvrir nos univers")}>{!featuredCollections.length ? categoryCards.map(card => <Link className="shop-story" key={card.id} href={card.href}><CatalogImage src={card.image} alt={t(card.alt)} sizes="(max-width: 640px) 45vw, (max-width: 1000px) 45vw, 25vw"/><div><h3>{t(card.title)}</h3><span>{t("Voir la collection")}<Icon name="arrow"/></span></div></Link>) : <FeaturedCollections items={featuredCollections} collections={catalog.ok ? catalog.data.collections : []} products={availableProducts}/>}</nav>{!featuredCollections.length && !categoryCards.length && <p className="home-catalog-status">{t("Nos collections seront dévoilées prochainement.")}</p>}</section>,
    arrivals: <section className="home-section container" aria-labelledby="new-title"><div className="section-heading"><div><p className="eyebrow">{t("Nos sélections")}</p><h2 id="new-title">{heading("arrivals", "Nos dernières pièces")}</h2></div><Link className="text-link" href="/boutique">{t("Voir toute la boutique")}<Icon name="arrow"/></Link></div>{section("arrivals").description && <p>{t(section("arrivals").description)}</p>}{latest.length ? <div className="product-grid arrivals-grid" style={{"--arrival-columns":latest.length} as CSSProperties}>{latest.map(item => <CatalogCard item={item} quickShop key={item.product.id}/>)}</div> : <div className="home-catalog-status"><p>{catalog.ok ? t("Aucune pièce disponible pour le moment.") : t("Le catalogue est temporairement indisponible.")}</p><Link className="text-link" href="/boutique">{t("Voir toute la boutique")}</Link></div>}</section>,
    season: <section className={styles.editorial} aria-labelledby="season-title"><div className={styles.editorialPhoto}><Image src={editorial} alt={t("Portrait d’une femme en hijab beige et blouse blanche sur fond neutre.")} fill placeholder="blur" sizes="(max-width: 640px) 100vw, 50vw"/></div><div className={styles.editorialCopy}><p className="eyebrow">{t("L’esprit AMOON")}</p><h2 id="season-title">{t(section("season").heading)}</h2><p>{t(section("season").description)}</p><Link className="button button--primary" href="/boutique">{t("Découvrir la boutique")}<Icon name="arrow"/></Link></div></section>,
    story: <section className="brand-story container" aria-labelledby="story-title"><div className="story-copy"><p className="eyebrow">{t("À propos d’Amoon")}</p><h2 id="story-title">{t(section("story").heading)}</h2><p>{t(section("story").description)}</p><Link className="button button--primary" href="/contact">{t("Notre histoire")}<Icon name="arrow"/></Link></div></section>,
    trust: <section className="trust-strip container" aria-label={t("Les engagements Amoon")}>{[
      ...(merchantSettings?.delivery.some(option => option.enabled) ? [{icon:"truck", title:t("Livraison au Maroc"), description:t("Consultez les villes desservies et les tarifs."), href:"/informations#livraison"}] : []),
      ...(merchantSettings?.payment.cod ? [{icon:"card", title:t("Paiement à la livraison"), description:t("Réglez à la réception de votre commande."), href:"/informations#commande"}] : []),
      ...(merchantSettings?.policies.exchange && merchantSettings.policies.exchange !== defaultStoreSettings().policies.exchange ? [{icon:"exchange", title:t("Retours & échanges"), description:t("Consultez les conditions de la boutique."), href:"/informations#retours"}] : []),
      ...(merchantSettings?.social.whatsapp && storeConfig.whatsappUrl ? [{icon:"heart", title:t("À votre écoute"), description:t("Un conseil ? Écrivez-nous sur WhatsApp."), href:storeConfig.whatsappUrl}] : []),
    ].map(item => <Link href={item.href} key={item.icon}><Icon name={item.icon as "truck"|"card"|"exchange"|"heart"}/><div><h3>{item.title}</h3><p>{item.description}</p></div></Link>)}</section>,
    social: <section className="social-journal container" aria-labelledby="social-title"><div className="section-heading"><div><p className="eyebrow">{t("Suivez-nous")}</p><h2 id="social-title">{heading("social", "Nos inspirations sur Instagram")}</h2></div><a href={storeConfig.instagramUrl || undefined} className="text-link" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/>{storeConfig.instagramHandle}</a></div>{section("social").description !== defaults.sections.find(s => s.key === "social")!.description && <p>{t(section("social").description)}</p>}</section>,
    newsletter: newsletterEnabled ? <section className="newsletter newsletter--wine" aria-labelledby="newsletter-title"><div className="container newsletter-inner"><div><h2 id="newsletter-title">{heading("newsletter", "Restez informée de nos nouveautés")}</h2><p>{t(section("newsletter").description)}</p></div><NewsletterForm enabled/></div></section> : null,
    promotions: <><div className="homepage-section-intro container"><h2>{t(section("promotions").heading)}</h2><p>{t(section("promotions").description)}</p></div><PromotionalBanners banners={content.banners}/></>,
  };
  const defaultOrder = content.sections.every((s,index) => s.key === defaults.sections[index]?.key);
  const sections = defaultOrder ? [section("trust"), ...content.sections.filter(s => s.key !== "trust")] : content.sections;
  return <div className={styles.page}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(brandSchema(siteOrigin(process.env.STOREFRONT_URL), await getLanguage()))}}/><HomepageHero/>{sections.filter(s => s.enabled && (s.key !== "social" || storeConfig.instagramUrl) && (s.key !== "promotions" || content.banners.some(b => b.enabled) || s.heading || s.description)).map(s => <Fragment key={s.key}>{blocks[s.key]}</Fragment>)}</div>;
}
