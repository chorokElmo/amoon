export const themeKeys = ["primary", "secondary", "accent", "background", "text", "header", "footer", "button_background", "button_text"] as const;
export type ThemePalette = Record<typeof themeKeys[number], string>;
const defaults: ThemePalette = { primary: "#7A0F32", secondary: "#EED7D3", accent: "#7A0F32", background: "#F8F2E9", text: "#211D1A", header: "#F8F2E9", footer: "#F8F2E9", button_background: "#7A0F32", button_text: "#FCF9F4" };
export function parseTheme(input: unknown): { colors: ThemePalette | null; revision: number } | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  if (!Number.isSafeInteger(data.revision) || Number(data.revision) < 0) return null;
  if (data.colors === null) return { colors: null, revision: Number(data.revision) };
  if (!data.colors || typeof data.colors !== "object") return null;
  const colors = data.colors as Record<string, unknown>;
  if (Object.keys(colors).length !== themeKeys.length || themeKeys.some(key => typeof colors[key] !== "string" || !/^#[0-9a-fA-F]{6}$/.test(String(colors[key])))) return null;
  return { colors: Object.fromEntries(themeKeys.map(key => [key, String(colors[key]).toUpperCase()])) as ThemePalette, revision: Number(data.revision) };
}
export async function readTheme(config: { url: string; publishableKey?: string }, transport: typeof fetch = fetch) {
  try {
    const origin = new URL(config.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return null;
    const response = await transport(new URL("/store/theme", origin), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json", ...(config.publishableKey ? { "x-publishable-api-key": config.publishableKey } : {}) } });
    return response.ok ? parseTheme(await response.json()) : null;
  } catch { return null; }
}
function ratio(first: string, second: string) {
  const light = (hex: string) => { const rgb = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722; };
  const a = light(first), b = light(second); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const readable = (preferred: string, background: string) => ratio(preferred, background) >= 4.5 ? preferred : ratio("#000000", background) >= ratio("#FFFFFF", background) ? "#000000" : "#FFFFFF";
export function themeProperties(input: ThemePalette | null): Record<string, string> | undefined {
  const colors = parseTheme({ colors: input, revision: 0 })?.colors;
  if (!colors || themeKeys.every(key => colors[key] === defaults[key])) return undefined;
  if ([colors.background, colors.header, colors.footer, colors.secondary].some(bg => ratio(colors.text, bg) < 4.5) || ratio(colors.button_text, colors.button_background) < 4.5) return undefined;
  return {
    "--wine": colors.primary, "--wine-dark": colors.primary, "--accent": colors.accent, "--blush": colors.secondary,
    "--color-cream": colors.background, "--color-ink": colors.text, "--color-taupe": colors.text, "--color-sand": colors.secondary, "--ivory": colors.background,
    "--line": colors.text, "--theme-border": colors.text, "--theme-muted-text": colors.text, "--theme-page-background": colors.background, "--theme-main-text": colors.text,
    "--theme-header-background": colors.header, "--theme-footer-background": colors.footer,
    "--theme-button-background": colors.button_background, "--theme-button-text": colors.button_text,
    "--theme-link": readable(colors.primary, colors.background), "--theme-header-link": readable(colors.primary, colors.header),
    "--theme-footer-link": readable(colors.primary, colors.footer), "--theme-secondary-link": readable(colors.primary, colors.secondary),
    "--theme-on-primary": readable("#FFFFFF", colors.primary), "--theme-on-accent": readable("#FFFFFF", colors.accent),
  };
}
