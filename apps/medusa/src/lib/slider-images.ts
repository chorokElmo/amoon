import sharp from "sharp";
import { MAX_IMAGE_BYTES } from "./slider-validation";

export async function validateSliderImage(content: string, mimeType: "image/jpeg" | "image/png" | "image/webp") {
  const input = Buffer.from(content, "base64");
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new Error("L’image doit peser au maximum 10 Mo.");
  const format = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[mimeType] as "jpeg" | "png" | "webp";
  const decoder = sharp(input, { limitInputPixels: 25_000_000, failOn: "warning" });
  const metadata = await decoder.metadata();
  if (metadata.format !== format || !metadata.width || !metadata.height || metadata.width > 6000 || metadata.height > 6000 || (metadata.pages ?? 1) > 1) {
    throw new Error("Image invalide : JPEG, PNG ou WebP non animé, au maximum 6000 × 6000 pixels / 25 mégapixels.");
  }
  // Decode and re-encode the image, stripping metadata and rejecting corrupt or disguised files.
  const { data, info } = await decoder.rotate().toFormat(format).toBuffer({ resolveWithObject: true });
  if (data.length > MAX_IMAGE_BYTES) throw new Error("L’image traitée dépasse 10 Mo.");
  return { data, width: info.width, height: info.height, extension: format === "jpeg" ? "jpg" : format };
}
