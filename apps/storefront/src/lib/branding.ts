export type BrandingImage = { url: string; width: number; height: number; mime_type: "image/png" };
export type StoreBranding = { images: { header_logo: BrandingImage | null; footer_logo: BrandingImage | null; favicon: BrandingImage | null } };
export function parseBranding(input: unknown): StoreBranding | null {
  if (!input || typeof input !== "object") return null;
  const images = (input as Record<string, unknown>).images;
  if (!images || typeof images !== "object") return null;
  for (const slot of ["header_logo", "footer_logo", "favicon"]) {
    const image = (images as Record<string, unknown>)[slot];
    if (image === null) continue;
    if (!image || typeof image !== "object") return null;
    const value = image as Record<string, unknown>;
    if (typeof value.url !== "string" || value.url.length > 2048 || value.mime_type !== "image/png" || !Number.isInteger(value.width) || !Number.isInteger(value.height) || Number(value.width) < 1 || Number(value.height) < 1 || Number(value.width) > 4096 || Number(value.height) > 4096) return null;
    try { const url = new URL(value.url); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null; } catch { return null; }
    if (slot === "favicon" && (value.width !== value.height || Number(value.width) < 16 || Number(value.width) > 512)) return null;
  }
  return { images: images as StoreBranding["images"] };
}
export async function readBranding(config: { url: string; publishableKey?: string }, transport: typeof fetch = fetch): Promise<StoreBranding | null> {
  try {
    const origin = new URL(config.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return null;
    const response = await transport(new URL("/store/branding", origin), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json", ...(config.publishableKey ? { "x-publishable-api-key": config.publishableKey } : {}) } });
    return response.ok ? parseBranding(await response.json()) : null;
  } catch { return null; }
}
