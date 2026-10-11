export const themeFields = [
  ["primary", "Couleur principale"], ["secondary", "Couleur secondaire"], ["accent", "Couleur d’accent"],
  ["background", "Fond de page"], ["text", "Texte principal"], ["header", "Fond de l’en-tête"],
  ["footer", "Fond du pied de page"], ["button_background", "Fond du bouton principal"], ["button_text", "Texte du bouton principal"],
] as const;
export type ThemeKey = typeof themeFields[number][0];
export type ThemePalette = Record<ThemeKey, string>;
export const defaultTheme: ThemePalette = {
  primary: "#7A0F32", secondary: "#EED7D3", accent: "#7A0F32", background: "#F8F2E9", text: "#211D1A",
  header: "#F8F2E9", footer: "#F8F2E9", button_background: "#7A0F32", button_text: "#FCF9F4",
};
export const themePresets: { name: string; colors: ThemePalette }[] = [
  { name: "Rose élégant", colors: { ...defaultTheme, primary: "#8C2548", accent: "#B45B79", secondary: "#F1DDE4", background: "#FFF8FA", header: "#FFF8FA", footer: "#F1DDE4", button_background: "#8C2548", button_text: "#FFFFFF" } },
  { name: "Noir & Or", colors: { primary: "#D9B45B", secondary: "#28231A", accent: "#D9B45B", background: "#151515", text: "#F8F2E9", header: "#151515", footer: "#202020", button_background: "#D9B45B", button_text: "#151515" } },
  { name: "Beige minimaliste", colors: { primary: "#65503B", secondary: "#E9DFD1", accent: "#A78B6D", background: "#FAF6EF", text: "#2D2721", header: "#FAF6EF", footer: "#E9DFD1", button_background: "#65503B", button_text: "#FFFFFF" } },
];
export const validHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  if (!validHex(first) || !validHex(second)) return 0;
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function themeContrastChecks(colors: ThemePalette) {
  return ([
    ["Texte sur le fond de page", colors.text, colors.background], ["Texte dans l’en-tête", colors.text, colors.header],
    ["Texte dans le pied de page", colors.text, colors.footer], ["Texte sur les surfaces secondaires", colors.text, colors.secondary],
    ["Texte du bouton principal", colors.button_text, colors.button_background],
  ] as const).map(([label, foreground, background]) => ({ label, ratio: contrastRatio(foreground, background), pass: contrastRatio(foreground, background) >= 4.5 }));
}
export function readableColor(preferred: string, background: string) {
  return contrastRatio(preferred, background) >= 4.5 ? preferred : contrastRatio("#000000", background) >= contrastRatio("#FFFFFF", background) ? "#000000" : "#FFFFFF";
}
