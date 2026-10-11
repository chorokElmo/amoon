import { defaultHomepageContent, safeContentLink, sectionKeys, type HomepageContent } from "../../../medusa/src/lib/homepage-content";
export { defaultHomepageContent };
export type { HomepageContent };
export function parseHomepageContent(input: unknown): HomepageContent | null {
  if (!input || typeof input !== "object") return null;
  const c = input as HomepageContent;
  const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
  const image = (v: unknown) => {
    if (v === null) return true;
    if (!v || typeof v !== "object") return false;
    const i = v as { image_id: unknown; image_url: unknown };
    if (!(i.image_id === null || text(i.image_id, 100)) || !text(i.image_url, 2048)) return false;
    try { const url = new URL(i.image_url as string, "https://amoon.invalid"); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !(i.image_url as string).startsWith("//"); } catch { return false; }
  };
  if (!(c.collections === null || Array.isArray(c.collections) && c.collections.length <= 12 && c.collections.every(v => v && text(v.id, 100) && text(v.collection_id, 100) && text(v.title, 140) && text(v.description, 500) && typeof v.enabled === "boolean" && image(v.image)))) return null;
  if (!Array.isArray(c.banners) || c.banners.length > 12 || !c.banners.every(b => b && text(b.id, 100) && text(b.title, 140) && text(b.subtitle, 500) && text(b.button_text, 80) && text(b.url, 2048) && (!b.url || safeContentLink(b.url)) && Boolean(b.button_text) === Boolean(b.url) && typeof b.enabled === "boolean" && image(b.desktop) && image(b.mobile) && (!b.enabled || b.desktop))) return null;
  const a = c.announcement;
  if (!a || !text(a.text, 300) || typeof a.enabled !== "boolean" || !text(a.url, 2048) || a.url && !safeContentLink(a.url) || ![a.background, a.color].every(v => v === null || typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) || Boolean(a.background) !== Boolean(a.color)) return null;
  if (!Array.isArray(c.sections) || c.sections.length !== sectionKeys.length || new Set(c.sections.map(s => s?.key)).size !== sectionKeys.length || !c.sections.every(s => s && sectionKeys.includes(s.key) && text(s.heading, 200) && text(s.description, 800) && typeof s.enabled === "boolean") || !c.sections.find(s => s.key === "trust")?.enabled) return null;
  return c;
}
export async function readHomepageContent(config: { url: string; publishableKey?: string }, transport: typeof fetch = fetch) {
  try {
    const origin = new URL(config.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return null;
    const response = await transport(new URL("/store/homepage-content", origin), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json", ...(config.publishableKey ? { "x-publishable-api-key": config.publishableKey } : {}) } });
    if (!response.ok) return null;
    return parseHomepageContent((await response.json()).content);
  } catch { return null; }
}
