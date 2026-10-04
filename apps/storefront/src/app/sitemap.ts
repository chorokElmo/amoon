import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { productPath, siteOrigin } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin(process.env.STOREFRONT_URL);
  const catalog = await getCatalog();
  // Avoid silently publishing an incomplete sitemap during a backend outage.
  if (!catalog.ok) throw new Error("Catalog unavailable for sitemap.");
  const groups = [...catalog.data.categories.map(g => "/collections/" + encodeURIComponent(g.handle)), ...catalog.data.collections.map(g => "/collections/" + encodeURIComponent(g.handle) + (catalog.data.categories.some(c => c.handle === g.handle) ? "?univers=collection" : ""))];
  return [...new Set(["/", "/boutique", "/collections", "/nouveautes", "/contact", ...groups, ...catalog.data.products.map(p => productPath(p.handle))])].map(path => ({ url: origin + path }));
}
