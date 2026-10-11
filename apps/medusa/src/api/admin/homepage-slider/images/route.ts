import { randomUUID } from "node:crypto";
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IFileModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { UploadSliderImageSchema } from "../../../../lib/slider-validation";
import { validateSliderImage } from "../../../../lib/slider-images";
import { HOMEPAGE_SLIDER_MODULE } from "../../../../modules/homepage-slider";
import type HomepageSliderService from "../../../../modules/homepage-slider/service";

export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof UploadSliderImageSchema>>, res: MedusaResponse) {
  let validated;
  try { validated = await validateSliderImage(req.validatedBody.content, req.validatedBody.mime_type); }
  catch { throw new MedusaError(MedusaError.Types.INVALID_DATA, "Image invalide. Utilisez un JPEG, PNG ou WebP non animé de 10 Mo maximum et 6000 × 6000 pixels / 25 mégapixels maximum."); }
  const files: IFileModuleService = req.scope.resolve(Modules.FILE);
  const file = await files.createFiles({ filename: `slider-${randomUUID()}.${validated.extension}`, mimeType: req.validatedBody.mime_type, content: validated.data.toString("base64"), access: "public" });
  const service: HomepageSliderService = req.scope.resolve(HOMEPAGE_SLIDER_MODULE);
  try {
    const image = await service.createSliderImages({ file_id: file.id, url: file.url, mime_type: req.validatedBody.mime_type, width: validated.width, height: validated.height });
    res.status(201).json({ image });
  } catch (error) {
    await files.deleteFiles(file.id);
    throw error;
  }
}
