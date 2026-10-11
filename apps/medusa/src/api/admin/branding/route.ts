import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import type { z } from "@medusajs/framework/zod";
import { BRANDING_MODULE } from "../../../modules/branding";
import type BrandingService from "../../../modules/branding/service";
import { brandingResponse } from "../../../lib/branding-response";
import { brandingSlots, type SaveBrandingSchema } from "../../../lib/branding-validation";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const result = await brandingResponse(req.scope.resolve(BRANDING_MODULE));
  const origin = process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "";
  res.setHeader("Cache-Control", "no-store");
  res.json({ ...result, defaults: { header_logo: `${origin}/images/amoon-logo-black.png`, footer_logo: `${origin}/images/amoon-logo-black.png`, favicon: `${origin}/images/favicon-default.svg` } });
}
export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof SaveBrandingSchema>>, res: MedusaResponse) {
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  const { assets, revision } = req.validatedBody;
  for (const slot of brandingSlots) {
    if (!assets[slot]) continue;
    const [image] = await service.listBrandingImages({ id: assets[slot]!, slot });
    if (!image) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cette image n’est pas une image de marque valide pour cet emplacement.");
  }
  await service.saveBranding(assets, revision);
  res.json(await brandingResponse(service));
}
