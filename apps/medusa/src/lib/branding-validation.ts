import { z } from "@medusajs/framework/zod";

export const MAX_BRANDING_BYTES = 5 * 1024 * 1024;
export const brandingSlots = ["header_logo", "footer_logo", "favicon"] as const;
export const BrandingSlotSchema = z.enum(brandingSlots);
export type BrandingSlot = z.infer<typeof BrandingSlotSchema>;
export const BrandingAssetsSchema = z.object({
  header_logo: z.string().min(1).max(100).nullable(),
  footer_logo: z.string().min(1).max(100).nullable(),
  favicon: z.string().min(1).max(100).nullable(),
}).strict();
export type BrandingAssets = z.infer<typeof BrandingAssetsSchema>;
export const defaultBrandingAssets: BrandingAssets = { header_logo: null, footer_logo: null, favicon: null };
export const SaveBrandingSchema = z.object({ revision: z.number().int().min(0), assets: BrandingAssetsSchema }).strict();
export const UploadBrandingSchema = z.object({
  slot: BrandingSlotSchema,
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"]),
  content: z.string().min(4).max(4 * Math.ceil(MAX_BRANDING_BYTES / 3)).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();
