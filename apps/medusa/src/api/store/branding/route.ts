import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { BRANDING_MODULE } from "../../../modules/branding";
import { brandingResponse } from "../../../lib/branding-response";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { images } = await brandingResponse(req.scope.resolve(BRANDING_MODULE));
  res.setHeader("Cache-Control", "no-store");
  res.json({ images: Object.fromEntries(Object.entries(images).map(([slot, image]) => [slot, image ? { url: image.url, width: image.width, height: image.height, mime_type: image.mime_type } : null])) });
}
