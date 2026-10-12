import arabic from "./messages-ar.json";
// Stable URLs; the preference cookie is independent of the signed cart cookie.
export const LOCALE_COOKIE = "amoon_locale";
export const locales = { fr: { language: "fr", direction: "ltr" }, ar: { language: "ar", direction: "rtl" } } as const;
export type Language = keyof typeof locales;
export function parseLanguage(value: unknown): Language { return value === "ar" ? "ar" : "fr"; }
export function translate(language: Language, message: string): string {
  if (language === "fr") return message;
  const dictionary: Record<string, string> = arabic;
  if (Object.hasOwn(dictionary, message)) return dictionary[message];
  const key = message.trim();
  return !Object.hasOwn(dictionary, key) ? message : message.slice(0, message.indexOf(key)) + dictionary[key] + message.slice(message.indexOf(key) + key.length);
}
export const locale = locales.fr;
export const fr = {
  announcement: "Livraison partout au Maroc",
  navigation: [
    { href: "/", label: "Accueil" }, { href: "/boutique", label: "Boutique" },
    { href: "/nouveautes", label: "Nouveautés" }, { href: "/collections", label: "Collections" }, { href: "/contact", label: "Contact" },
  ],
  menu: "Ouvrir le menu", close: "Fermer", search: "Rechercher", searchTitle: "Une pièce en tête ?",
  searchLabel: "Nom du produit", searchPlaceholder: "Robe, ensemble, abaya…", cart: "Panier",
};
