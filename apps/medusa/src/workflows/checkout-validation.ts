import { completeCartWorkflow, addShippingMethodToCartWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";
import { codIssue } from "../lib/cod-validation";
import { readNativeStoreSettings, settingsConnection } from "../lib/store-settings-db";
import { deliveryEligible, deliveryFee, deliverySubtotal, numericAmount } from "../lib/store-settings";
// Runs inside Medusa's completion lock, against the same cart used to create the order.
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const issue = codIssue(cart); if (issue) throw new MedusaError(MedusaError.Types.INVALID_DATA, issue);
  // Policy changes apply to unfinished carts; preserve idempotent completed-order recovery.
  if (cart.completed_at) return;
  const { settings } = await readNativeStoreSettings(settingsConnection(container));
  const cod = cart.payment_collection?.payment_sessions?.some((s: { provider_id: string }) => s.provider_id === "pp_system_default");
  if (cod && !settings.payment.cod) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Le paiement à la livraison est désactivé. Contactez la boutique.");
  for (const method of cart.shipping_methods || []) {
    const managed = settings.delivery.find(d => d.id === method.shipping_option_id);
    if (managed && (cart.currency_code !== "mad" || !deliveryEligible(managed, cart.shipping_address) || numericAmount(method.amount) !== deliveryFee(managed, deliverySubtotal(cart)))) throw new MedusaError(MedusaError.Types.INVALID_DATA, "La livraison a changé. Vérifiez votre ville et sélectionnez à nouveau la livraison.");
  }
});
addShippingMethodToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const { settings } = await readNativeStoreSettings(settingsConnection(container));
  for (const option of input.options) {
    const managed = settings.delivery.find(d => d.id === option.id);
    if (managed && (cart.currency_code !== "mad" || !deliveryEligible(managed, cart.shipping_address))) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cette livraison n’est pas disponible pour cette ville.");
  }
});
