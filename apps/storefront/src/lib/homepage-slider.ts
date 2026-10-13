export type HomepageSlide = {
  id: string; title: string; description: string; eyebrow: string;
  button_label: string; button_link: string; secondary_label: string; secondary_link: string;
  image_url: string; image_alt: string;
  position: "center" | "right center" | "left bottom"; zoom: number;
};
type SliderConfig = { configured: boolean; slides: HomepageSlide[] };

function safeLink(value: unknown): value is string {
  if (typeof value !== "string" || !value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

export function parseHomepageSlider(input: unknown): SliderConfig | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  if (typeof data.configured !== "boolean" || !Array.isArray(data.slides) || data.slides.length > 12) return null;
  const ids = new Set<string>();
  for (const value of data.slides) {
    if (!value || typeof value !== "object") return null;
    const slide = value as Record<string, unknown>;
    if (["id", "title", "description", "eyebrow", "button_label", "image_url", "image_alt", "secondary_label", "secondary_link"].some(key => typeof slide[key] !== "string")) return null;
    if (!slide.id || ids.has(slide.id as string) || !slide.title || !slide.image_url || !slide.image_alt || !slide.button_label || !safeLink(slide.button_link)) return null;
    if (Boolean(slide.secondary_label) !== Boolean(slide.secondary_link) || (slide.secondary_link && !safeLink(slide.secondary_link))) return null;
    if (!["center", "right center", "left bottom"].includes(String(slide.position)) || typeof slide.zoom !== "number" || slide.zoom < 1 || slide.zoom > 1.5) return null;
    ids.add(slide.id as string);
  }
  return { configured: data.configured, slides: data.slides as HomepageSlide[] };
}

export async function readHomepageSlider(config: { url: string; publishableKey?: string }, transport: typeof fetch = fetch): Promise<SliderConfig | null> {
  try {
    const origin = new URL(config.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return null;
    const response = await transport(new URL("/store/homepage-slider", origin), {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json", ...(config.publishableKey ? { "x-publishable-api-key": config.publishableKey } : {}) },
    });
    return response.ok ? parseHomepageSlider(await response.json()) : null;
  } catch { return null; }
}

export function fallbackHomepageSlides(image: string, alt: string): HomepageSlide[] {
  return (["center", "right center", "left bottom"] as const).map((position, index) => ({
    id: `fallback-${index}`, title: "Des pièces qui vous\nressemblent.",
    description: "Confortables, féminines et faciles à porter.\nDécouvrez la nouvelle collection Amoon.", eyebrow: "NOUVELLE COLLECTION · AMOON",
    button_label: "DÉCOUVRIR LA COLLECTION", button_link: "/collections", secondary_label: "", secondary_link: "",
    image_url: image, image_alt: alt, position, zoom: image === "/images/hero-amoon-fashion-reference.png" ? 1 : [1, 1.2, 1.35][index],
  }));
}
