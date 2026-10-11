// Shared, dependency-free content contract used by the admin and storefront.
export const sectionKeys = ["collections", "arrivals", "season", "story", "trust", "social", "newsletter", "promotions"] as const;
export type SectionKey = typeof sectionKeys[number];
export type ContentImage = { image_id: string | null; image_url: string };
export type FeaturedCollection = { id: string; collection_id: string; title: string; description: string; image: ContentImage | null; enabled: boolean };
export type PromoBanner = { id: string; title: string; subtitle: string; button_text: string; url: string; desktop: ContentImage | null; mobile: ContentImage | null; enabled: boolean };
export type ContentSection = { key: SectionKey; heading: string; description: string; enabled: boolean };
export type HomepageContent = {
  collections: FeaturedCollection[] | null;
  banners: PromoBanner[];
  announcement: { text: string; enabled: boolean; url: string; background: string | null; color: string | null };
  sections: ContentSection[];
};
export const sectionLabels: Record<SectionKey, string> = { collections: "Collections à la une", arrivals: "Nouveautés", season: "Collection de saison", story: "L’esprit Amoon", trust: "Engagements Amoon (obligatoire)", social: "Instagram", newsletter: "Newsletter", promotions: "Bannières promotionnelles" };
export function defaultHomepageContent(): HomepageContent {
  return {
    collections: null, banners: [],
    announcement: { text: "Livraison partout au Maroc", enabled: true, url: "", background: null, color: null },
    sections: [
      { key: "collections", heading: "", description: "", enabled: true },
      { key: "arrivals", heading: "Les nouveautés", description: "", enabled: true },
      { key: "season", heading: "Des pièces pensées\npour vous.", description: "Découvrez des silhouettes féminines\naux lignes élégantes et intemporelles.", enabled: true },
      { key: "story", heading: "Moins d’effort.\nPlus d’allure.", description: "Une garde-robe pensée pour être portée, associée et aimée au quotidien.", enabled: true },
      { key: "trust", heading: "", description: "", enabled: true },
      { key: "social", heading: "Au fil d’Amoon.", description: "Notre carnet d’inspiration · Visuels illustratifs", enabled: true },
      { key: "newsletter", heading: "Un peu d’Amoon,\ndans votre quotidien.", description: "Recevez nos nouveautés et offres exclusives.", enabled: true },
      { key: "promotions", heading: "", description: "", enabled: true },
    ],
  };
}
export function safeContentLink(value: string) {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value, "https://amoon.invalid");
    return value.startsWith("/") ? !value.startsWith("//") && url.origin === "https://amoon.invalid" : url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}
export function collectionContentHref(handle: string) { return `/collections/${encodeURIComponent(handle)}?univers=collection`; }
