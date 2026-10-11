import "server-only";
import { cache } from "react";
import { readBranding } from "./branding";
import { catalogImageSource } from "@/components/catalog/catalog-image";

// React memoizes only within one server render; the backend request stays uncached.
export const getStoreBranding = cache(async () => {
  const data = await readBranding({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY });
  const resolve = (slot: "header_logo" | "footer_logo" | "favicon") => {
    const image = data?.images[slot];
    const src = image ? catalogImageSource(image.url) : null;
    return image && src ? { src, width: image.width, height: image.height } : undefined;
  };
  return { headerLogo: resolve("header_logo"), footerLogo: resolve("footer_logo"), favicon: resolve("favicon") };
});
