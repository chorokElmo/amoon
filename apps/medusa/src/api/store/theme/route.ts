import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { BRANDING_MODULE } from "../../../modules/branding";
import type BrandingService from "../../../modules/branding/service";
import { ThemePaletteSchema } from "../../../lib/theme-validation";
import { themeContrastChecks } from "../../../lib/theme-palette";
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  const [settings] = await service.listThemeSettings({ id: "store" });
  const parsed = ThemePaletteSchema.safeParse(settings?.published);
  const colors = parsed.success && themeContrastChecks(parsed.data).every(check => check.pass) ? parsed.data : null;
  res.setHeader("Cache-Control", "no-store"); res.json({ colors, revision: settings?.published_revision || 0 });
}
