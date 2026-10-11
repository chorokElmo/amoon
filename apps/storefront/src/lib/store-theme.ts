import "server-only";
import { readTheme, themeProperties } from "./theme";
export async function getStoreTheme() {
  const config = await readTheme({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY });
  return { revision: config?.revision || 0, properties: themeProperties(config?.colors || null) };
}
