import "server-only";
import { cache } from "react";
import { defaultStoreSettings, readStoreSettings } from "./store-settings";
export const getStoreConfig = cache(async () => {
  const settings = await readStoreSettings({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY }).catch(() => null) || defaultStoreSettings("Amoon Collection", process.env.WHATSAPP_NUMBER || "212600940327");
  const instagramUrl = settings.social.instagram || null;
  return { settings, instagramUrl, whatsappUrl: settings.social.whatsapp ? `https://wa.me/${settings.social.whatsapp}` : null, facebookUrl: settings.social.facebook || null, tiktokUrl: settings.social.tiktok || null, instagramHandle: instagramUrl ? "@" + (new URL(instagramUrl).pathname.split("/").filter(Boolean)[0] || "Instagram") : "" };
});
