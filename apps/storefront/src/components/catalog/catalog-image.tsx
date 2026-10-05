import { CatalogPhoto } from "./catalog-photo";
import { mediaTarget } from "@/lib/catalog-media";
export function catalogImageSource(src: string | null) {
  if (src?.startsWith("/images/demo/")) return null;
  const local = src?.startsWith("/images/") && !src.includes("..") && !src.includes("\\") ? src : null;
  const target = src ? mediaTarget(src, process.env.MEDUSA_INTERNAL_URL || "", process.env.PRODUCT_IMAGE_ORIGINS || "", process.env.LEGACY_MEDIA_ORIGINS || "") : null;
  return local || (target ? "/api/catalog-image?url=" + encodeURIComponent(target.toString()) : null);
}
export function CatalogImage({ src, alt, sizes = "(max-width: 640px) 45vw, (max-width: 1000px) 40vw, 25vw" }: { src: string | null; alt: string; sizes?: string }) {
  const resolved = catalogImageSource(src);
  return <CatalogPhoto key={resolved || "missing"} src={resolved} alt={alt} sizes={sizes}/>;
}
