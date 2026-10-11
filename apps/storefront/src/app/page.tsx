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
export const metadata = { title: "Amoon Collection — Mode féminine au Maroc", description: "Découvrez les nouveautés Amoon Collection : vêtements féminins, ensembles et robes. Livraison partout au Maroc et paiement à la livraison.", alternates: { canonical: "/" }, openGraph: { title: "Amoon Collection", url: "/", locale: "fr_MA", type: "website" as const, description: "Découvrez les nouveautés Amoon Collection, boutique de mode féminine au Maroc.", images: [{url:"/images/hero-amoon-rack.png",alt:"Collection Amoon"}] } };
export default async function Home() {
  await connection();
  const storeConfig = await getStoreConfig();
  const [catalog, content] = await Promise.all([getCatalog(), getStoreHomepageContent()]);
  const defaults = defaultHomepageContent();
  const section = (key: SectionKey) => content.sections.find(s => s.key === key)!;
  const heading = (key: SectionKey, original: ReactNode) => section(key).heading === defaults.sections.find(s => s.key === key)!.heading ? original : <span style={{whiteSpace:"pre-line"}}>{section(key).heading}</span>;
  const description = (key: SectionKey, original: ReactNode) => section(key).description === defaults.sections.find(s => s.key === key)!.description ? original : <span style={{whiteSpace:"pre-line"}}>{section(key).description}</span>;
  const latest = catalog.ok ? selectCatalog(catalog.data, parseFilters({}), undefined, 4).items : [];
  const categoryHref = (name: string) => { const category = catalog.ok ? catalog.data.categories.find(group => fold(group.name).includes(fold(name))) : null; return category ? "/collections/" + encodeURIComponent(category.handle) : "/boutique?q=" + encodeURIComponent(name); };
  const featured = catalog.ok ? catalog.data.collections.find(group => catalog.data.products.some(product => product.collectionId === group.id)) : null;
  const inspiration = [
    { src: "/images/campaign-wine.png", position: "5% center", alt: "Silhouette bordeaux" },
    { src: "/images/editorial-wine.png", position: "95% 90%", alt: "Matières et tons doux" },
    { src: "/images/demo/ensemble.png", position: "center", alt: "Inspiration ensemble féminin" },
    { src: "/images/editorial-wine.png", position: "85% center", alt: "Une garde-robe aux tons chauds" },
    { src: "/images/campaign-wine.png", position: "100% center", alt: "Silhouette en ivoire" },
  ];
  const blocks: Record<SectionKey, ReactNode> = {
    collections: (<>{(section("collections").heading || section("collections").description) && <div className="homepage-section-intro container"><h2>{section("collections").heading}</h2><p>{section("collections").description}</p></div>}    <nav className="shop-stories category-editorial container" aria-label="Découvrir nos univers">
      {content.collections === null ? <>{[{title:"Nouveautés",description:"La nouvelle sélection Amoon",href:"/nouveautes",image:"new-arrivals"},{title:"Ensembles",description:"Des looks faciles à porter",href:categoryHref("Ensembles"),image:"outfits"},{title:"Robes",description:"Des silhouettes féminines",href:categoryHref("Robes"),image:"dresses"}].map(tile=><Link className="shop-story" href={tile.href} key={tile.title}><Image src={"/images/category-"+tile.image+".png"} alt="" quality={90} fill sizes="(max-width: 640px) 85vw, 30vw"/><div><h2>{tile.title}</h2><p>{tile.description}</p><span>Découvrir<Icon name="arrow"/></span></div></Link>)}</> : <FeaturedCollections items={content.collections} collections={catalog.ok ? catalog.data.collections : []}/>}
    </nav></>),
    arrivals: (<section className="home-section container" aria-labelledby="new-title"><div className="section-heading"><div><p className="eyebrow">Un nouveau regard</p><h2 id="new-title">{heading("arrivals", "Les nouveautés")} <span className="heading-flourish" aria-hidden="true">♡</span></h2></div><Link className="text-link" href="/nouveautes">Voir toutes les nouveautés<Icon name="arrow"/></Link></div>{section("arrivals").description && <p className="homepage-section-intro">{section("arrivals").description}</p>}{latest.length ? <div className="product-grid arrivals-grid" style={{"--arrival-columns": Math.max(1, latest.length)} as CSSProperties}>{latest.map(item=><CatalogCard item={item} key={item.product.id}/>)}</div> : <div className="home-catalog-status"><p>{catalog.ok?"Les nouvelles pièces arrivent bientôt.":"Le catalogue est temporairement indisponible."}</p><Link className="text-link" href="/contact">Contacter Amoon</Link></div>}</section>),
    season: (<section className="season-campaign" aria-labelledby="season-title"><div className="season-photo"><Image src="/images/editorial-wine.png" alt="Inspiration : détails d’une tenue bordeaux et matières douces" quality={90} fill sizes="(max-width: 640px) 100vw, 50vw"/></div><div className="season-copy"><Botanical/><p className="eyebrow">La collection automne</p><h2 id="season-title">{heading("season", <>Des pièces pensées<br/><em>pour vous.</em></>)}</h2><p>{description("season", <>Découvrez des silhouettes féminines<br/>aux lignes élégantes et intemporelles.</>)}</p><Link className="button button--primary" href={featured?"/collections/"+encodeURIComponent(featured.handle)+"?univers=collection":"/collections"}>Explorer la collection<Icon name="arrow"/></Link></div></section>),
    story: (<section className="brand-story container" aria-labelledby="story-title"><div className="story-copy"><p className="eyebrow">L’esprit Amoon</p><h2 id="story-title">{heading("story", <>Moins d’effort.<br/><em>Plus d’allure.</em></>)}</h2><p>{section("story").description}</p><Link className="button button--outline" href="/contact">En savoir plus<Icon name="arrow"/></Link></div><div className="story-photo story-photo--model"><Image src="/images/editorial-wine.png" alt="Inspiration : les détails d’une silhouette bordeaux" quality={90} fill sizes="(max-width: 640px) 50vw, 25vw"/></div><div className="story-photo story-photo--rack"><Image src="/images/editorial-wine.png" alt="Inspiration : une sélection de vêtements sur cintres" quality={90} fill sizes="(max-width: 640px) 50vw, 25vw"/></div><div className="story-photo story-photo--cloth"><Image src="/images/campaign-wine.png" alt="Inspiration : pièces ivoire, bordeaux et blush" quality={90} fill sizes="(max-width: 640px) 100vw, 25vw"/></div></section>),
    trust: (<section className="trust-strip container" aria-label="Les engagements Amoon">{[{icon:"diamond",title:"Une mode féminine",description:"Des silhouettes élégantes et faciles à porter."},{icon:"truck",title:"Livraison au Maroc",description:"Dans toutes les villes du Royaume."},{icon:"exchange",title:"Échange facile",description:storeConfig.settings.policies.exchange === defaultStoreSettings().policies.exchange ? "Sous 7 jours." : "Consultez notre politique d’échange."},{icon:"card",title:storeConfig.settings.payment.cod ? "Paiement à la livraison" : "Commande sécurisée",description:"Simple et sécurisé."}].map(item=><div key={item.title}><Icon name={item.icon as "diamond"|"truck"|"exchange"|"card"}/><div><h3>{item.title}</h3><p>{item.description}</p></div></div>)}</section>),
    social: (<section className="social-journal container" aria-labelledby="social-title"><div><p className="eyebrow">Inspiration quotidienne</p><h2 id="social-title">{section("social").heading}</h2><a href={storeConfig.instagramUrl || undefined} className="social-handle" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/>{storeConfig.instagramHandle}</a></div><div className="social-mosaic">{inspiration.map((photo,index)=><a href={storeConfig.instagramUrl || undefined} target="_blank" rel="noopener noreferrer" key={index} aria-label="Découvrir Amoon sur Instagram"><Image src={photo.src} alt={photo.alt} quality={90} fill sizes="(max-width: 640px) 32vw, 14vw" style={{objectPosition:photo.position}}/></a>)}</div><a className="button button--outline" href={storeConfig.instagramUrl || undefined} target="_blank" rel="noopener noreferrer">Suivre sur Instagram<Icon name="arrow"/></a><p className="social-disclosure">{section("social").description}</p></section>),
    newsletter: (<section className="newsletter newsletter--wine" aria-labelledby="newsletter-title"><Botanical/><div className="container newsletter-inner"><h2 id="newsletter-title">{heading("newsletter", <>Un peu d’Amoon,<br/><em>dans votre quotidien.</em></>)}</h2><div><p>{section("newsletter").description}</p><NewsletterForm enabled={Boolean(newsletterEndpoint())}/></div></div></section>),
    promotions: (<>{(section("promotions").heading || section("promotions").description) && <div className="homepage-section-intro container"><h2>{section("promotions").heading}</h2><p>{section("promotions").description}</p></div>}<PromotionalBanners banners={content.banners}/></>),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(brandSchema(siteOrigin(process.env.STOREFRONT_URL)))}}/>
    <HomepageHero/>
    {content.sections.filter(s => s.enabled && (s.key !== "social" || storeConfig.instagramUrl) && (s.key !== "promotions" || content.banners.some(b => b.enabled) || s.heading || s.description)).map(s => <Fragment key={s.key}>{blocks[s.key]}</Fragment>)}
  </>;
}
