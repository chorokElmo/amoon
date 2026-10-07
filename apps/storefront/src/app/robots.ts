import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin(process.env.STOREFRONT_URL);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname);
  return { rules: { userAgent: "*", ...(local ? { disallow: "/" } : { allow: "/", disallow: ["/api/", "/panier", "/commande", "/favoris"] }) }, sitemap: origin + "/sitemap.xml" };
}
