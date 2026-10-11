import "server-only";
import { cache } from "react";
import { readHomepageContent, defaultHomepageContent } from "./homepage-content";
import { catalogImageSource } from "@/components/catalog/catalog-image";
import type { ContentImage } from "../../../medusa/src/lib/homepage-content";
export const getStoreHomepageContent = cache(async () => {
  const content = (await readHomepageContent({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY })) || defaultHomepageContent();
  const image = (value: ContentImage | null) => {
    const src = value ? catalogImageSource(value.image_url) : null;
    return value && src ? { ...value, image_url: src } : null;
  };
  return { ...content, collections: content.collections?.map(c => ({ ...c, image: image(c.image) })) ?? null, banners: content.banners.map(b => ({ ...b, desktop: image(b.desktop), mobile: image(b.mobile) })) };
});
