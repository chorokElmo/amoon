import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { z } from "@medusajs/framework/zod";
import { readNativeStoreSettings, settingsConnection } from "../../../lib/store-settings-db";
import { manageableShipping, nativeShippingOptions } from "../../../lib/store-settings-shipping";
import type { SaveStoreSettingsSchema } from "../../../lib/store-settings-validation";
import { saveStoreSettingsWorkflow } from "../../../workflows/save-store-settings";
async function response(req: AuthenticatedMedusaRequest) {
  const [{ settings, revision }, options] = await Promise.all([readNativeStoreSettings(settingsConnection(req.scope)), nativeShippingOptions(req.scope)]);
  return { settings, revision, shipping_options: options.map(o => ({ id: o.id, name: o.name, manageable: manageableShipping(o), amount: o.prices?.find(p => p.currency_code === "mad")?.amount ?? null })) };
}
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) { res.setHeader("Cache-Control", "no-store"); res.json(await response(req)); }
export async function POST(req: AuthenticatedMedusaRequest<z.infer<typeof SaveStoreSettingsSchema>>, res: MedusaResponse) {
  await saveStoreSettingsWorkflow(req.scope).run({ input: req.validatedBody });
  res.json(await response(req));
}
