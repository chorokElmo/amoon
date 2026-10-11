import type BrandingService from "../modules/branding/service";
import { brandingSlots, defaultBrandingAssets, BrandingAssetsSchema } from "./branding-validation";

export async function brandingResponse(service: BrandingService) {
  const [config] = await service.listBrandingConfigs({ id: "store" });
  const assets = config ? BrandingAssetsSchema.parse(config.assets) : { ...defaultBrandingAssets };
  const ids = brandingSlots.flatMap(slot => assets[slot] ? [assets[slot]!] : []);
  const images = ids.length ? await service.listBrandingImages({ id: ids }) : [];
  const resolved = Object.fromEntries(brandingSlots.map(slot => {
    const image = images.find(image => image.id === assets[slot] && image.slot === slot);
    return [slot, image ? { id: image.id, url: image.url, width: image.width, height: image.height, mime_type: image.mime_type } : null];
  }));
  return { revision: config?.revision || 0, assets, images: resolved };
}
