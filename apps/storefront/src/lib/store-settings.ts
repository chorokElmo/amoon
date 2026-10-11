import { defaultStoreSettings, socialUrl, validPhone, type StoreSettings } from "../../../medusa/src/lib/store-settings";
export type { StoreSettings };
export { defaultStoreSettings };
export function parseStoreSettings(input: unknown): StoreSettings | null {
  if (!input || typeof input !== "object") return null;
  const s = input as StoreSettings;
  const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
  if (!s.info || !text(s.info.name,140) || !s.info.name || !text(s.info.email,254) || s.info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.info.email) || !text(s.info.phone,40) || !validPhone(s.info.phone) || !text(s.info.address,1000) || !text(s.info.description,2000)) return null;
  if (!s.social || !text(s.social.whatsapp,40) || s.social.whatsapp && !/^[1-9]\d{7,14}$/.test(s.social.whatsapp) || !(["instagram", "facebook", "tiktok"] as const).every(key => text(s.social[key],2048) && socialUrl(s.social[key],key))) return null;
  if (!s.payment || typeof s.payment.cod !== "boolean" || !s.policies || ![s.policies.returns,s.policies.exchange,s.policies.delivery].every(v => text(v,10000))) return null;
  if (!Array.isArray(s.delivery) || s.delivery.length > 30 || !s.delivery.every(o => o && text(o.id,100) && text(o.name,140) && typeof o.enabled === "boolean" && typeof o.fee === "number" && Number.isFinite(o.fee) && o.fee >= 0 && (o.free_threshold === null || typeof o.free_threshold === "number" && Number.isFinite(o.free_threshold) && o.free_threshold >= 0) && Array.isArray(o.cities) && o.cities.length <= 100 && o.cities.every(v => text(v,80)))) return null;
  return s;
}
export async function readStoreSettings(config: { url: string; publishableKey?: string }, transport: typeof fetch = fetch) {
  const origin = new URL(config.url);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw Error("Configuration de boutique invalide.");
  const response = await transport(new URL("/store/store-settings",origin),{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5000),headers:{Accept:"application/json",...(config.publishableKey ? {"x-publishable-api-key":config.publishableKey} : {})}});
  if (response.status === 404) return null;
  if (!response.ok) throw Error("Les paramètres de la boutique sont indisponibles.");
  const result = parseStoreSettings((await response.json()).settings);
  if (!result) throw Error("Les paramètres de la boutique sont invalides.");
  return result;
}
