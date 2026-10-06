import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { relatedProducts } from "@/lib/product-model";
import { storeConfig } from "@/lib/store-config";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { catalogImageSource } from "@/components/catalog/catalog-image";
import { CatalogStatus } from "@/components/catalog/catalog-status";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductOptions } from "@/components/product/product-options";
import { productPath, productSchema, serializeJsonLd, siteOrigin } from "@/lib/seo";
type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ variante?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { handle } = await params;
  const catalog = await getCatalog();
  const product = catalog.ok ? catalog.data.products.find(item => item.handle === handle) : null;
  if (!product) return { title: "Pièce indisponible", robots: { index: false, follow: false } };
  const images = product.images.map(catalogImageSource).filter((image): image is string => image !== null);
  return { title: product.title, description: product.description.slice(0, 160) || undefined,
    alternates: { canonical: productPath(product.handle) },
    openGraph: { title: product.title, description: product.description.slice(0, 160) || undefined, url: productPath(product.handle), type: "website", locale: "fr_MA", images },
  };
}
export default async function ProductPage({ params, searchParams }: Props) {
  await connection();
  const { handle } = await params;
  const query = await searchParams;
  const catalog = await getCatalog();
  if (!catalog.ok) return <CatalogStatus title="La pièce" action={"/produits/" + encodeURIComponent(handle)}/>;
  const product = catalog.data.products.find(item => item.handle === handle);
  if (!product) notFound();
  const images = product.images.map(catalogImageSource).filter((image): image is string => image !== null);
  const related = relatedProducts(catalog.data, product);
  const structuredData = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema(product, siteOrigin(process.env.STOREFRONT_URL), images)) }}/>;
  return <div className="product-detail container">{structuredData}<nav className="catalog-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>/</span><Link href="/boutique">Boutique</Link><span>/</span><span aria-current="page">{product.title}</span></nav><div className="product-detail-layout"><ProductGallery images={images} title={product.title} productId={product.id} imageFit={product.imageFit} isNew={product.createdAt > 0 && Date.now() >= product.createdAt && Date.now() - product.createdAt < 30 * 86400000}/><section className="product-detail-copy" aria-labelledby="product-title"><p className="eyebrow">Amoon Collection</p><h1 id="product-title">{product.title}</h1><ProductOptions key={product.id + ":" + (typeof query.variante === "string" ? query.variante : "")} product={product} initialVariantId={typeof query.variante === "string" ? query.variante : undefined} whatsappUrl={storeConfig.whatsappUrl}/><details className="product-description" open><summary>Description</summary><p className="product-plain-text">{product.description || "La description de cette pièce sera renseignée prochainement."}</p></details>{product.composition && <details className="product-description"><summary>Composition & entretien</summary><p className="product-plain-text">{product.composition}</p></details>}<details className="product-description"><summary>Livraison au Maroc</summary><p className="product-plain-text">Les modes et frais de livraison sont affichés avant la confirmation de votre commande.</p><Link className="text-link" href="/informations#livraison">En savoir plus sur la livraison</Link></details><details className="product-description"><summary>Retours & échanges</summary><p className="product-plain-text">Besoin d’un conseil ou d’un échange ? Contactez-nous avec votre référence de commande pour connaître les modalités.</p><Link className="text-link" href="/informations#retours">Contacter la boutique</Link></details></section></div>{related.length > 0 && <section className="home-section" aria-labelledby="related-title"><div className="section-heading"><h2 id="related-title">Dans le même esprit</h2><Link className="text-link" href="/boutique">Explorer la boutique</Link></div><div className="product-grid">{related.map(item => <CatalogCard key={item.product.id} item={item}/>)}</div></section>}</div>;
}
