export type DeliverySetting = { id: string; name: string; fee: number; cities: string[]; free_threshold: number | null; enabled: boolean };
export type StoreSettings = {
  info: { name: string; email: string; phone: string; address: string; description: string };
  social: { whatsapp: string; instagram: string; facebook: string; tiktok: string };
  delivery: DeliverySetting[];
  payment: { cod: boolean };
  policies: { returns: string; exchange: string; delivery: string };
};
export function defaultStoreSettings(name = "Amoon Collection", whatsapp = "212600940327"): StoreSettings {
  return { info: { name, email: "", phone: "", address: "", description: "Des pièces choisies avec soin.\nUne élégance qui vous ressemble." }, social: { whatsapp, instagram: "https://www.instagram.com/amoon.collection1/", facebook: "", tiktok: "" }, delivery: [], payment: { cod: true }, policies: {
    returns: "Une question de taille ou un problème avec votre pièce ? Contactez-nous avec votre référence de commande avant de renvoyer un article. Nous vous communiquerons les modalités applicables à votre demande.",
    exchange: "Échange facile sous 7 jours. Contactez-nous avec votre référence de commande pour connaître les modalités.",
    delivery: "Renseignez votre ville, votre téléphone et votre adresse à la commande. Les modes de livraison disponibles et leurs frais s’affichent avant la confirmation.",
  } };
}
export function normalizePhone(value: string) { return value.replace(/[\s().-]/g, "").replace(/^00/, "+"); }
export function whatsappDigits(value: string) { return normalizePhone(value).replace(/^\+/, ""); }
export function validPhone(value: string) { return value === "" || /^\+?[1-9]\d{7,14}$/.test(normalizePhone(value)); }
export function cityKey(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'-]+/g, " ").trim(); }
export function socialUrl(value: string, platform: "instagram" | "facebook" | "tiktok") {
  if (!value) return true;
  try { const url = new URL(value); const hosts = platform === "facebook" ? ["facebook.com", "fb.com", "fb.me"] : [platform + ".com"]; return url.protocol === "https:" && !url.username && !url.password && !/[\s\\\u0000-\u001f]/.test(value) && hosts.some(host => url.hostname === host || url.hostname.endsWith("." + host)); } catch { return false; }
}
export function deliveryEligible(option: DeliverySetting, address: { city?: string | null; country_code?: string | null } | null | undefined) {
  return option.enabled && address?.country_code === "ma" && (!option.cities.length || option.cities.some(city => cityKey(city) === cityKey(address.city || "")));
}
export function deliveryFee(option: DeliverySetting, subtotal: number) { if (!Number.isFinite(subtotal) || subtotal < 0) throw Error("Sous-total invalide."); return option.free_threshold !== null && subtotal >= option.free_threshold ? 0 : option.fee; }
export function numericAmount(value: unknown): number | null {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const n = typeof value === "number" ? value : typeof v.numeric === "number" ? v.numeric : typeof v.numeric_ === "number" ? v.numeric_ : null;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}
export function deliverySubtotal(context: { items?: unknown[] }) {
  if (!Array.isArray(context.items)) throw Error("Sous-total indisponible.");
  return Math.round(context.items.reduce<number>((sum, input) => {
    const item = input as Record<string, unknown>;
    const subtotal = numericAmount(item.subtotal);
    const unit = numericAmount(item.unit_price), quantity = numericAmount(item.quantity);
    if (subtotal !== null) return sum + subtotal;
    if (unit === null || quantity === null || !Number.isInteger(quantity)) throw Error("Sous-total indisponible.");
    return sum + unit * quantity;
  }, 0) * 100) / 100;
}
