import { z } from "@medusajs/framework/zod";

export const MAX_SLIDES = 12;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const FALLBACK_IMAGE = "/images/hero-amoon-rack.png";

export function safeSlideLink(value: string) {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) {
    try { return new URL(value, "https://amoon.invalid").origin === "https://amoon.invalid"; } catch { return false; }
  }
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

const link = z.string().trim().max(2048).refine(safeSlideLink, "Utilisez un chemin comme /boutique ou une URL HTTPS.");
export const SlideSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(500),
  eyebrow: z.string().trim().max(80),
  button_label: z.string().trim().min(1).max(80),
  button_link: link,
  secondary_label: z.string().trim().max(80),
  secondary_link: z.union([z.literal(""), link]),
  image_id: z.string().max(100).nullable(),
  image_url: z.string().min(1).max(2048),
  image_alt: z.string().trim().min(1).max(200),
  enabled: z.boolean(),
  position: z.enum(["center", "right center", "left bottom"]),
  zoom: z.number().min(1).max(1.5),
}).strict().refine(slide => Boolean(slide.secondary_label) === Boolean(slide.secondary_link), "Renseignez le texte et le lien du bouton secondaire ensemble.");
export const SaveSliderSchema = z.object({
  revision: z.number().int().min(0),
  slides: z.array(SlideSchema).max(MAX_SLIDES).refine(slides => new Set(slides.map(slide => slide.id)).size === slides.length, "Chaque diapositive doit avoir un identifiant unique."),
}).strict();
export type Slide = z.infer<typeof SlideSchema>;

export const UploadSliderImageSchema = z.object({
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  content: z.string().min(4).max(4 * Math.ceil(MAX_IMAGE_BYTES / 3)).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();
