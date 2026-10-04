import type { CatalogProduct } from "./catalog-model";

export function siteOrigin(value: string | undefined) {
  try {
    const url = new URL(value || "http://localhost:8000");
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error("STOREFRONT_URL must be an HTTP(S) origin without credentials or a path."); }
}
export function productPath(handle: string) { return "/produits/" + encodeURIComponent(handle); }
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function productSchema(product: CatalogProduct, origin: string, images: string[]) {
  const url = origin + productPath(product.handle);
  const offers = product.variants.filter(v => v.price !== null).map(v => ({
    "@type": "Offer", url: url + "?variante=" + encodeURIComponent(v.id), priceCurrency: "MAD", price: v.price,
    ...(v.sku ? { sku: v.sku } : {}),
    ...(v.stock === "unknown" ? {} : { availability: "https://schema.org/" + ({ in_stock: "InStock", out_of_stock: "OutOfStock", backorder: "BackOrder" } as const)[v.stock] }),
  }));
  return { "@context": "https://schema.org", "@type": "Product", name: product.title, url,
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: images.map(image => new URL(image, origin).href) } : {}),
    ...(offers.length ? { offers } : {}),
  };
}
