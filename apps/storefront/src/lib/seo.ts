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
  return { "@context": "https://schema.org", "@type": "Product", name: product.title, url, brand: { "@type": "Brand", name: "Amoon Collection" },
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: images.map(image => new URL(image, origin).href) } : {}),
    ...(offers.length ? { offers } : {}),
  };
}

export function breadcrumbSchema(origin: string, items: { name: string; path: string }[]) {
  return { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:items.map((item,index)=>({"@type":"ListItem",position:index+1,name:item.name,item:new URL(item.path,origin).href})) };
}
export function brandSchema(origin: string) {
  return {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":origin+"/#organization",name:"Amoon Collection",url:origin,logo:origin+"/images/amoon-logo-black.png",sameAs:["https://www.instagram.com/amoon.collection1/"]},{"@type":"WebSite","@id":origin+"/#website",name:"Amoon Collection",url:origin,inLanguage:"fr-MA",publisher:{"@id":origin+"/#organization"}}]};
}
export function catalogMetadata(title: string, description: string, canonical: string, query: Record<string,string|string[]|undefined>) {
  const filtered=Object.entries(query).some(([key,value])=>!['page','univers'].includes(key)&&Boolean(Array.isArray(value)?value.some(Boolean):value));
  const page=typeof query.page==='string'&&/^\d+$/.test(query.page)?Number(query.page):1;
  const url=!filtered&&Number.isSafeInteger(page)&&page>1?canonical+(canonical.includes('?')?'&':'?')+'page='+page:canonical;
  return {title,description,alternates:{canonical:url},...(filtered?{robots:{index:false,follow:true}}:{}),openGraph:{title,description,url,siteName:"Amoon Collection",locale:"fr_MA",type:"website" as const,images:[{url:"/images/hero-amoon-rack.png",alt:"Collection Amoon"}]},twitter:{card:"summary_large_image" as const,title,description,images:["/images/hero-amoon-rack.png"]}};
}
