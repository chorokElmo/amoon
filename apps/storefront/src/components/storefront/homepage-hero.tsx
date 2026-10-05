import { catalogImageSource } from "@/components/catalog/catalog-image";
import { HeroSlider } from "./hero-slider";

// An approved campaign/product image can replace the fallback from server configuration.
export function HomepageHero({ imageSrc = process.env.AMOON_HERO_IMAGE, imageAlt = process.env.AMOON_HERO_IMAGE_ALT }: { imageSrc?: string; imageAlt?: string }) {
  const approvedImage = catalogImageSource(imageSrc || null);
  return <HeroSlider src={approvedImage || "/images/hero-amoon-rack.png"} alt={imageAlt || "Collection Amoon : vêtements bordeaux, ivoire et blush sur un portant"}/>;
}
