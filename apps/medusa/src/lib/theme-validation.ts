import { z } from "@medusajs/framework/zod";
import { themeContrastChecks } from "./theme-palette";
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Utilisez une couleur HEX à six caractères, par exemple #7A0F32.").transform(value => value.toUpperCase());
export const ThemePaletteSchema = z.object({ primary: color, secondary: color, accent: color, background: color, text: color, header: color, footer: color, button_background: color, button_text: color }).strict();
export const SaveThemeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("draft"), revision: z.number().int().min(0), colors: ThemePaletteSchema }).strict(),
  z.object({ action: z.literal("publish"), revision: z.number().int().min(0), colors: ThemePaletteSchema.refine(colors => themeContrastChecks(colors).every(check => check.pass), "Publication impossible : le contraste du texte doit atteindre 4,5:1 sur chaque surface et sur le bouton principal.") }).strict(),
  z.object({ action: z.literal("reset"), revision: z.number().int().min(0) }).strict(),
]);
