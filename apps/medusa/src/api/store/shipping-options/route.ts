import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listShippingOptionsForCartWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { readNativeStoreSettings, settingsConnection } from "../../../lib/store-settings-db";
import { deliveryEligible, deliveryFee, deliverySubtotal } from "../../../lib/store-settings";
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, is_return } = req.filterableFields;
  const { settings } = await readNativeStoreSettings(settingsConnection(req.scope));
  const { result: options } = await listShippingOptionsForCartWorkflow(req.scope).run({ input: { cart_id: String(cart_id), is_return: Boolean(is_return), fields: req.queryConfig.fields } });
  if (!settings.delivery.length || is_return) { res.json({ shipping_options: options }); return; }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "cart", fields: ["shipping_address.city", "shipping_address.country_code", "currency_code", "items.*"], filters: { id: String(cart_id) } });
  const cart = data[0];
  res.json({ shipping_options: options.flatMap(o => {
    const managed = settings.delivery.find(d => d.id === o.id);
    if (!managed) return [o];
    if (!cart || cart.currency_code !== "mad" || !deliveryEligible(managed, cart.shipping_address)) return [];
    return [{ ...o, amount: deliveryFee(managed, deliverySubtotal(cart)), is_tax_inclusive: false }];
  }) });
}
