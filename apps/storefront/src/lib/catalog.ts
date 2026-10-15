import "server-only";
import { cache } from "react";
import { readMedusaCatalog, CatalogUnavailable } from "./medusa-catalog";
import { getLanguage } from "./i18n-server";
import { localizeCatalog } from "./product-localization";
import { populatedCatalogGroups, productReadinessIssues } from "./catalog-model";
import { catalogImageSource } from "@/components/catalog/catalog-image";
export const getCatalog = cache(async () => {
  const language = await getLanguage();
  try {
    const data = await readMedusaCatalog({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY || "", regionId: process.env.MEDUSA_REGION_ID });
    const products = data.products.filter(product => productReadinessIssues(product).length === 0 && product.images.some(image => catalogImageSource(image) !== null));
    return { ok: true as const, data: localizeCatalog(populatedCatalogGroups({ ...data, products }), language) };
  } catch (error) {
    // Only emit a diagnostic code, never URLs, keys or upstream response bodies.
    const code = error instanceof CatalogUnavailable ? error.code : "upstream";
    console.warn("[catalog] " + code);
    return { ok: false as const, code };
  }
});
