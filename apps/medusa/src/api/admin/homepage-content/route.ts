import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import type { z } from "@medusajs/framework/zod";
import { BRANDING_MODULE } from "../../../modules/branding";
import type BrandingService from "../../../modules/branding/service";
import { HOMEPAGE_SLIDER_MODULE } from "../../../modules/homepage-slider";
import type HomepageSliderService from "../../../modules/homepage-slider/service";
import { defaultHomepageContent, type ContentImage } from "../../../lib/homepage-content";
import { HomepageContentSchema, type SaveHomepageContentSchema } from "../../../lib/homepage-content-validation";
async function response(service: BrandingService) {
  const [settings] = await service.listHomepageContentSettings({ id: "homepage" });
  return { draft: settings?.draft || null, published: settings?.published || null, revision: settings?.revision || 0, published_revision: settings?.published_revision || 0, defaults: defaultHomepageContent() };
}
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.json(await response(req.scope.resolve(BRANDING_MODULE)));
}
export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof SaveHomepageContentSchema>>, res: MedusaResponse) {
  const { action, revision, content } = req.validatedBody;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const collectionIds = content.collections?.map(c => c.collection_id) || [];
  if (collectionIds.length) {
    const { data } = await query.graph({ entity: "product_collection", fields: ["id", "handle"], filters: { id: collectionIds } });
    if (collectionIds.some(id => !data.some(c => c.id === id && c.handle))) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Une collection sélectionnée n’existe plus. Retirez-la ou choisissez une autre collection.");
  }
  const imageRefs = [...(content.collections || []).flatMap(c => c.image ? [c.image] : []), ...content.banners.flatMap(b => [b.desktop, b.mobile].filter((i): i is ContentImage => Boolean(i)))];
  const ids = [...new Set(imageRefs.flatMap(i => i.image_id ? [i.image_id] : []))];
  const images: HomepageSliderService = req.scope.resolve(HOMEPAGE_SLIDER_MODULE);
  const records = ids.length ? await images.listSliderImages({ id: ids }) : [];
  function resolve(image: ContentImage | null): ContentImage | null {
    if (!image) return null;
    const record = records.find(r => r.id === image.image_id);
    if (!record) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Image introuvable. Importez l’image avec le formulaire.");
    return { image_id: record.id, image_url: record.url };
  }
  const resolved = HomepageContentSchema.parse({ ...content, collections: content.collections?.map(c => ({ ...c, image: resolve(c.image) })) ?? null, banners: content.banners.map(b => ({ ...b, desktop: resolve(b.desktop), mobile: resolve(b.mobile) })) });
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  await service.saveHomepageContent(action, resolved, revision);
  res.json(await response(service));
}
