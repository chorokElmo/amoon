import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { readNativeStoreSettings, settingsConnection } from "../../../lib/store-settings-db";
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { settings, revision } = await readNativeStoreSettings(settingsConnection(req.scope));
  res.setHeader("Cache-Control", "no-store"); res.json({ settings, revision });
}
