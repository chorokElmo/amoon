import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { BRANDING_MODULE } from "../../../modules/branding";
import type BrandingService from "../../../modules/branding/service";
import { HomepageContentSchema } from "../../../lib/homepage-content-validation";
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  const [settings] = await service.listHomepageContentSettings({ id: "homepage" });
  const parsed = HomepageContentSchema.safeParse(settings?.published);
  res.setHeader("Cache-Control", "no-store");
  res.json({ content: parsed.success ? parsed.data : null, revision: settings?.published_revision || 0 });
}
