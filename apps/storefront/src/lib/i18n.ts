// Route names remain stable as locale labels and direction are extended.
export const locales = { fr: { language: "fr", direction: "ltr" } } as const;
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
