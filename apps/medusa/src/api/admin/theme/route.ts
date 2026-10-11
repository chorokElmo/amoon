import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { z } from "@medusajs/framework/zod";
import { BRANDING_MODULE } from "../../../modules/branding";
import type BrandingService from "../../../modules/branding/service";
import { defaultTheme, themePresets } from "../../../lib/theme-palette";
import { ThemePaletteSchema, type SaveThemeSchema } from "../../../lib/theme-validation";

async function response(service: BrandingService) {
  const [settings] = await service.listThemeSettings({ id: "store" });
  return { draft: settings?.draft ? ThemePaletteSchema.parse(settings.draft) : null, published: settings?.published ? ThemePaletteSchema.parse(settings.published) : null, revision: settings?.revision || 0, published_revision: settings?.published_revision || 0, defaults: defaultTheme, presets: themePresets };
}
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store"); res.json(await response(req.scope.resolve(BRANDING_MODULE)));
}
export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof SaveThemeSchema>>, res: MedusaResponse) {
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  const body = req.validatedBody;
  await service.saveTheme(body.action, body.action === "reset" ? null : body.colors, body.revision);
  res.json(await response(service));
}
