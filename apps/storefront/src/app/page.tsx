import Link from "next/link";
export const metadata = { alternates: { canonical: "/" }, openGraph: { title: "Amoon Collection", url: "/", locale: "fr_MA", type: "website" as const } };
import { connection } from "next/server";
import { storeConfig } from "@/lib/store-config";
import { getCatalog } from "@/lib/catalog";
import { parseFilters, selectCatalog } from "@/lib/catalog-model";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { NewsletterForm } from "@/components/storefront/newsletter";
import { newsletterEndpoint } from "@/lib/newsletter-config";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function Heading({ eyebrow, title, href, label }: { eyebrow: string; title: string; href: string; label: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link className="text-link" href={href}>{label}<Icon name="arrow"/></Link></div>;
}
export default async function Home() {
  await connection();
  const catalog = await getCatalog();
  const latest = catalog.ok ? selectCatalog(catalog.data, parseFilters({}), undefined, 4).items : [];
  const categories = catalog.ok ? catalog.data.categories.filter(group => catalog.data.products.some(product => product.categoryIds.includes(group.id))) : [];
  const collections = catalog.ok ? catalog.data.collections.filter(group => catalog.data.products.some(product => product.collectionId === group.id)) : [];
  return <>
    <section className="campaign campaign--typographic" aria-labelledby="campaign-title">
      <span className="campaign-monogram" aria-hidden="true">a.</span>
      <div className="campaign-copy container"><p className="eyebrow">L’univers Amoon Collection</p><h1 id="campaign-title">L’élégance,<br/><em>au quotidien.</em></h1><p>Des lignes épurées. Une allure libre.<br/>Des pièces à porter à votre façon.</p><Link className={buttonClass()} href="/boutique">Découvrir la collection<Icon name="arrow"/></Link></div><span className="campaign-caption">Le style, en toute simplicité — Amoon Collection</span>
    </section>
    <section className="home-section container" aria-label="Nouveautés"><Heading eyebrow="Un nouveau regard" title="Les nouveautés" href="/nouveautes" label="Toutes les nouveautés"/>{latest.length > 0 ? <div className="product-grid">{latest.map(item => <CatalogCard key={item.product.id} item={item}/>)}</div> : <div className="home-catalog-status"><p>{catalog.ok ? "Aucune pièce n’est publiée pour le moment." : "Le catalogue est temporairement indisponible."}</p><Link className="text-link" href="/contact">Contacter Amoon<Icon name="arrow"/></Link></div>}</section>
    {categories.length > 0 && <section className="category-section container" aria-label="Nos catégories"><Heading eyebrow="À chacune son allure" title="Trouvez votre essentiel" href="/boutique" label="Explorer la boutique"/><nav className="category-links" aria-label="Toutes les catégories">{categories.map(group => <Link key={group.id} href={"/collections/" + encodeURIComponent(group.handle)}>{group.name}</Link>)}</nav></section>}
    {collections.length > 0 && <section className="home-section container" aria-label="Nos collections"><Heading eyebrow="L’univers Amoon" title="Les collections" href="/collections" label="Toutes les collections"/><nav className="category-links" aria-label="Collections publiées">{collections.map(group => <Link key={group.id} href={"/collections/" + encodeURIComponent(group.handle) + "?univers=collection"}>{group.name}</Link>)}</nav></section>}
    <section className="editorial-banner container"><p className="eyebrow">L’esprit Amoon</p><h2>Moins d’effort.<br/><em>Plus d’allure.</em></h2><p>Une garde-robe qui vous ressemble, du premier café aux derniers instants de la journée.</p><Link className="text-link" href="/collections">Entrer dans notre univers<Icon name="arrow"/></Link><span aria-hidden="true" className="banner-monogram">a.</span></section>
    <section className="benefits container" aria-label="Pourquoi Amoon Collection"><div><span>01</span><h3>Un style au quotidien</h3><p>Des silhouettes féminines et faciles à associer.</p></div><div><span>02</span><h3>Une marque, un univers</h3><p>Une sensibilité aux lignes, aux couleurs et aux détails.</p></div><div><span>03</span><h3>Restons proches</h3><p>Une question sur une pièce ? <Link href="/contact">Échangeons ensemble.</Link></p></div></section>
    <section className="instagram-section container" aria-labelledby="instagram-title"><div className="instagram-heading"><p className="eyebrow">L’inspiration continue</p><h2 id="instagram-title">Au fil d’Amoon.</h2><a className="text-link" href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer"><Icon name="instagram"/> @amoon.collection1<Icon name="arrow"/></a></div><p className="instagram-note">Découvrez notre actualité et les photos de nos pièces sur Instagram.</p></section>
    <section className="newsletter container" aria-labelledby="newsletter-title"><div><p className="eyebrow">Une lettre, un peu d’inspiration</p><h2 id="newsletter-title">Restons en lien.</h2><p>Les nouvelles collections et les nouvelles idées, dans votre boîte mail.</p></div><div>{newsletterEndpoint() ? <NewsletterForm/> : <><p>Les inscriptions ouvriront bientôt.</p><a className="text-link" href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">Nous suivre sur Instagram<Icon name="arrow"/></a></>}</div></section>
  </>;
}
