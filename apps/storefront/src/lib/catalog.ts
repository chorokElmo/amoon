import "server-only";
import { cache } from "react";
import { readMedusaCatalog, CatalogUnavailable } from "./medusa-catalog";
export const getCatalog = cache(async () => {
  try {
    const data = await readMedusaCatalog({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY || "", regionId: process.env.MEDUSA_REGION_ID });
    return { ok: true as const, data };
  } catch (error) {
    // Only emit a diagnostic code, never URLs, keys or upstream response bodies.
    const code = error instanceof CatalogUnavailable ? error.code : "upstream";
    console.warn("[catalog] " + code);
    return { ok: false as const, code };
  }
});
