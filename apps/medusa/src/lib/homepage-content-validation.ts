import { z } from "@medusajs/framework/zod";
import { safeContentLink, sectionKeys } from "./homepage-content";
import { contrastRatio } from "./theme-palette";
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const text = (max: number) => z.string().trim().max(max, `Limitez ce texte à ${max} caractères.`);
const link = text(2048).refine(safeContentLink, "Utilisez un chemin de la boutique ou une URL HTTPS.");
const optionalLink = z.union([z.literal(""), link]);
const image = z.object({ image_id: id.nullable(), image_url: text(2048).min(1) }).strict().nullable();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Utilisez une couleur HEX à six chiffres.").transform(v => v.toUpperCase()).nullable();
const unique = (items: { id: string }[]) => new Set(items.map(item => item.id)).size === items.length;
export const HomepageContentSchema = z.object({
  collections: z.array(z.object({ id, collection_id: id, title: text(140).min(1, "Renseignez le titre de collection."), description: text(500), image, enabled: z.boolean() }).strict()).max(12, "Vous pouvez afficher jusqu’à 12 collections.").refine(unique, "Identifiants de collection dupliqués.").refine(items => new Set(items.map(item => item.collection_id)).size === items.length, "Chaque collection ne peut être sélectionnée qu’une fois.").nullable(),
  banners: z.array(z.object({ id, title: text(140).min(1, "Renseignez le titre de la bannière."), subtitle: text(500), button_text: text(80), url: optionalLink, desktop: image, mobile: image, enabled: z.boolean() }).strict().refine(b => Boolean(b.button_text) === Boolean(b.url), "Renseignez le texte et le lien du bouton ensemble.").refine(b => !b.enabled || Boolean(b.desktop), "Une bannière active nécessite une image pour ordinateur.")).max(12, "Vous pouvez afficher jusqu’à 12 bannières.").refine(unique, "Identifiants de bannière dupliqués."),
  announcement: z.object({ text: text(300).min(1, "Renseignez le texte de l’annonce."), enabled: z.boolean(), url: optionalLink, background: color, color }).strict().refine(a => Boolean(a.background) === Boolean(a.color), "Choisissez les deux couleurs ou utilisez le thème.").refine(a => !a.background || !a.color || contrastRatio(a.background, a.color) >= 4.5, "Le contraste de l’annonce doit être d’au moins 4,5:1."),
  sections: z.array(z.object({ key: z.enum(sectionKeys), heading: text(200), description: text(800), enabled: z.boolean() }).strict()).length(sectionKeys.length).refine(items => new Set(items.map(s => s.key)).size === sectionKeys.length, "Chaque section doit apparaître une fois.").refine(items => items.find(s => s.key === "trust")?.enabled === true, "Les engagements Amoon doivent rester actifs.").refine(items => items.every(s => ["collections", "trust", "promotions"].includes(s.key) || s.heading.length > 0), "Les sections éditoriales nécessitent un titre."),
}).strict();
export const SaveHomepageContentSchema = z.object({ action: z.enum(["draft", "publish"]), revision: z.number().int().min(0), content: HomepageContentSchema }).strict();
