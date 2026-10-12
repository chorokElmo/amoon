import { localizeMetadata } from "@/lib/i18n-metadata";
import { getTranslations, getLanguage } from "@/lib/i18n-server";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { relatedProducts } from "@/lib/product-model";
import { defaultStoreSettings } from "@/lib/store-settings";
import { getStoreConfig } from "@/lib/store-config";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { catalogImageSource } from "@/components/catalog/catalog-image";
import { CatalogStatus } from "@/components/catalog/catalog-status";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductOptions } from "@/components/product/product-options";
import { breadcrumbSchema, productPath, productSchema, serializeJsonLd, siteOrigin } from "@/lib/seo";
type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ variante?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations();
  await connection();
  const { handle } = await params;
  const catalog = await getCatalog();
  const product = catalog.ok ? catalog.data.products.find(item => item.handle === handle) : null;
  if (!product) return localizeMetadata({ title: t("Pièce indisponible"), robots: { index: false, follow: false } }, await getLanguage());
  const images = product.images.map(catalogImageSource).filter((image): image is string => image !== null);
  return { title: product.title, description: product.description.slice(0, 160) || product.title + t(" — découvrez cette pièce Amoon Collection, son prix en MAD et ses variantes."),
    alternates: { canonical: productPath(product.handle) },
    twitter: { card: "summary_large_image", title: product.title, description: product.description.slice(0,160) || product.title + " — Amoon Collection", images },
    openGraph: { title: product.title, description: product.description.slice(0, 160) || `${product.title} — découvrez cette pièce Amoon Collection, son prix en MAD et ses variantes.`, url: productPath(product.handle), type: "website", locale: t("fr_MA"), images },
  };
}
export default async function ProductPage({ params, searchParams }: Props) {
  const t = await getTranslations();
  const storeConfig = await getStoreConfig();
  await connection();
  const { handle } = await params;
  const query = await searchParams;
  const catalog = await getCatalog();
  if (!catalog.ok) return <CatalogStatus title={t("La pièce")} action={"/produits/" + encodeURIComponent(handle)}/>;
  const product = catalog.data.products.find(item => item.handle === handle);
  if (!product) notFound();
  const images = product.images.map(catalogImageSource).filter((image): image is string => image !== null);
  const defaults = defaultStoreSettings();
  const policies = storeConfig.settings.policies;
  const configuredPolicy = (key: keyof typeof policies) => policies[key].trim() && policies[key] !== defaults.policies[key];
  const related = relatedProducts(catalog.data, product);
  const breadcrumbData = <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(breadcrumbSchema(siteOrigin(process.env.STOREFRONT_URL),[{name:t("Accueil"),path:"/"},{name:t("Boutique"),path:"/boutique"},{name:product.title,path:productPath(product.handle)}]))}}/>;
  const structuredData = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema(product, siteOrigin(process.env.STOREFRONT_URL), images)) }}/>;
  return <div className="product-detail container">{structuredData}{breadcrumbData}<nav className="catalog-breadcrumb" aria-label={t("Fil d’Ariane")}><Link href="/">{t("Accueil")}</Link><span>/</span><Link href="/boutique">{t("Boutique")}</Link><span>/</span><span aria-current="page">{product.title}</span></nav><div className="product-detail-layout"><ProductGallery images={images} title={product.title} productId={product.id} imageFit={product.imageFit} isNew={product.createdAt > 0 && Date.now() >= product.createdAt && Date.now() - product.createdAt < 30 * 86400000}/><section className="product-detail-copy" aria-labelledby="product-title"><p className="eyebrow">Amoon Collection</p><h1 id="product-title">{product.title}</h1><ProductOptions key={product.id + ":" + (typeof query.variante === "string" ? query.variante : "")} product={product} initialVariantId={typeof query.variante === "string" ? query.variante : undefined} whatsappUrl={storeConfig.whatsappUrl}/>{product.description.trim() && <details className="product-description" open><summary>{t("Description")}</summary><p className="product-plain-text">{product.description}</p></details>}{product.sizeGuide?.trim() && <details className="product-description"><summary>{t("Guide des tailles")}</summary><p className="product-plain-text">{product.sizeGuide}</p></details>}{product.composition && <details className="product-description"><summary>{t("Composition & entretien")}</summary><p className="product-plain-text">{product.composition}</p></details>}{configuredPolicy("delivery") && <details className="product-description"><summary>{t("Livraison")}</summary><p className="product-plain-text">{t(policies.delivery)}</p></details>}{configuredPolicy("returns") && <details className="product-description"><summary>{t("Retours")}</summary><p className="product-plain-text">{t(policies.returns)}</p></details>}{configuredPolicy("exchange") && <details className="product-description"><summary>{t("Échanges")}</summary><p className="product-plain-text">{t(policies.exchange)}</p></details>}</section></div>{related.length > 0 && <section className="home-section" aria-labelledby="related-title"><div className="section-heading"><h2 id="related-title">{t("Dans le même esprit")}</h2><Link className="text-link" href="/boutique">{t("Explorer la boutique")}</Link></div><div className="product-grid">{related.map(item => <CatalogCard key={item.product.id} item={item}/>)}</div></section>}</div>;
}
