import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { HOMEPAGE_SLIDER_MODULE } from "../../../modules/homepage-slider";
import type HomepageSliderService from "../../../modules/homepage-slider/service";
import { FALLBACK_IMAGE, SaveSliderSchema } from "../../../lib/slider-validation";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: HomepageSliderService = req.scope.resolve(HOMEPAGE_SLIDER_MODULE);
  const [config] = await service.listSliderConfigs({ id: "homepage" });
  res.setHeader("Cache-Control", "no-store");
  const storefront = process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "http://localhost:8000";
  const fallback_image_url = new URL(FALLBACK_IMAGE, storefront).toString();
  res.json({ ...(config ? { configured: true, slides: config.slides, revision: config.revision } : { configured: false, slides: [], revision: 0 }), fallback_image_url });
}

export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof SaveSliderSchema>>, res: MedusaResponse) {
  const service: HomepageSliderService = req.scope.resolve(HOMEPAGE_SLIDER_MODULE);
  const { slides, revision } = req.validatedBody;
  const ids = [...new Set(slides.flatMap(slide => slide.image_id ? [slide.image_id] : []))];
  const images = ids.length ? await service.listSliderImages({ id: ids }) : [];
  const resolved = slides.map(slide => {
    if (!slide.image_id) {
      if (slide.image_url !== FALLBACK_IMAGE) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Importez une image valide pour chaque diapositive.");
      return slide;
    }
    const image = images.find(image => image.id === slide.image_id);
    if (!image) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Image introuvable. Importez-la à nouveau.");
    return { ...slide, image_url: image.url };
  });
  res.json(await service.saveSlides(resolved, revision));
}
