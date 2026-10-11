import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { HOMEPAGE_SLIDER_MODULE } from "../../../modules/homepage-slider";
import type HomepageSliderService from "../../../modules/homepage-slider/service";
import type { Slide } from "../../../lib/slider-validation";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: HomepageSliderService = req.scope.resolve(HOMEPAGE_SLIDER_MODULE);
  const [config] = await service.listSliderConfigs({ id: "homepage" });
  res.setHeader("Cache-Control", "no-store");
  res.json({ configured: Boolean(config), slides: config ? (config.slides as unknown as Slide[]).filter(slide => slide.enabled).map(slide => ({
    id: slide.id, title: slide.title, description: slide.description, eyebrow: slide.eyebrow,
    button_label: slide.button_label, button_link: slide.button_link, secondary_label: slide.secondary_label, secondary_link: slide.secondary_link,
    image_url: slide.image_url, image_alt: slide.image_alt, position: slide.position, zoom: slide.zoom,
  })) : [] });
}
