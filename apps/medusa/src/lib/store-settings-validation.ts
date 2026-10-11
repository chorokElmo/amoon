import { z } from "@medusajs/framework/zod";
import { cityKey, normalizePhone, socialUrl, validPhone, whatsappDigits } from "./store-settings";
const text = (max: number) => z.string().trim().max(max, `Limitez ce texte à ${max} caractères.`);
const money = z.number().finite().min(0, "Le montant ne peut pas être négatif.").max(100000, "Montant trop élevé.").refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001, "Utilisez deux décimales maximum.");
const phone = text(40).refine(validPhone, "Utilisez un numéro international avec indicatif, par exemple +212600940327.").transform(normalizePhone);
export const StoreSettingsSchema = z.object({
  info: z.object({ name: text(140).min(1, "Renseignez le nom de la boutique."), email: z.union([z.literal(""), text(254).email("Adresse e-mail invalide.")]), phone, address: text(1000), description: text(2000) }).strict(),
  social: z.object({ whatsapp: phone.transform(whatsappDigits), instagram: text(2048).refine(v => socialUrl(v, "instagram"), "Utilisez une URL HTTPS Instagram."), facebook: text(2048).refine(v => socialUrl(v, "facebook"), "Utilisez une URL HTTPS Facebook."), tiktok: text(2048).refine(v => socialUrl(v, "tiktok"), "Utilisez une URL HTTPS TikTok.") }).strict(),
  delivery: z.array(z.object({ id: text(100).regex(/^so_[a-zA-Z0-9]+$/, "Option de livraison invalide."), name: text(140).min(1, "Renseignez le nom de livraison."), fee: money, cities: z.array(text(80).min(2, "Ville invalide.")).max(100).refine(c => new Set(c.map(cityKey)).size === c.length, "Retirez les villes en double."), free_threshold: money.nullable(), enabled: z.boolean() }).strict()).max(30).refine(rows => new Set(rows.map(r => r.id)).size === rows.length, "Option de livraison en double."),
  payment: z.object({ cod: z.boolean() }).strict(),
  policies: z.object({ returns: text(10000), exchange: text(10000), delivery: text(10000) }).strict(),
}).strict();
export const SaveStoreSettingsSchema = z.object({ revision: z.number().int().min(0), settings: StoreSettingsSchema }).strict();
