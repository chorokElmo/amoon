import { catalogImageSource } from "@/components/catalog/catalog-image";
import { HeroSlider } from "./hero-slider";
import { fallbackHomepageSlides, readHomepageSlider } from "@/lib/homepage-slider";

// An approved campaign/product image can replace the fallback from server configuration.
export async function HomepageHero({ imageSrc = process.env.AMOON_HERO_IMAGE, imageAlt = process.env.AMOON_HERO_IMAGE_ALT }: { imageSrc?: string; imageAlt?: string }) {
  const approvedImage = catalogImageSource(imageSrc || null);
  const config = await readHomepageSlider({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY });
  const slides = config?.configured
    ? config.slides.flatMap(slide => { const src = catalogImageSource(slide.image_url); return src ? [{ ...slide, image_url: src }] : []; })
    : fallbackHomepageSlides(approvedImage || "/images/hero-amoon-rack.png", imageAlt || "Collection Amoon : vêtements bordeaux, ivoire et blush sur un portant");
  return slides.length ? <HeroSlider slides={slides}/> : null;
}
