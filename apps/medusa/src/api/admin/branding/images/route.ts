import { randomUUID } from "node:crypto";
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IFileModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import type { z } from "@medusajs/framework/zod";
import type { UploadBrandingSchema } from "../../../../lib/branding-validation";
import { validateBrandingImage } from "../../../../lib/branding-images";
import { BRANDING_MODULE } from "../../../../modules/branding";
import type BrandingService from "../../../../modules/branding/service";

export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof UploadBrandingSchema>>, res: MedusaResponse) {
  const { content, mime_type, slot } = req.validatedBody;
  let validated;
  try { validated = await validateBrandingImage(content, mime_type, slot); }
  catch { throw new MedusaError(MedusaError.Types.INVALID_DATA, slot === "favicon" ? "Favicon invalide. Utilisez un PNG carré (16 à 512 pixels) ou un ICO PNG/bitmap 24 ou 32 bits, de 1 Mo maximum." : "Logo invalide. PNG, JPG, WebP ou SVG vectoriel simple, non animé, de 5 Mo maximum et 4096 × 4096 pixels / 16 mégapixels maximum. Les scripts, styles et références externes SVG sont interdits."); }
  const files: IFileModuleService = req.scope.resolve(Modules.FILE);
  const file = await files.createFiles({ filename: `branding-${slot}-${randomUUID()}.png`, mimeType: validated.mime_type, content: validated.data.toString("base64"), access: "public" });
  const service: BrandingService = req.scope.resolve(BRANDING_MODULE);
  try {
    const image = await service.createBrandingImages({ file_id: file.id, url: file.url, slot, mime_type: validated.mime_type, width: validated.width, height: validated.height });
    res.status(201).json({ image });
  } catch (error) { await files.deleteFiles(file.id); throw error; }
}
