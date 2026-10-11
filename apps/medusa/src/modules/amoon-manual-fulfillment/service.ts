import { ManualFulfillmentService } from "@medusajs/fulfillment-manual/dist/services/manual-fulfillment";
import type { CalculateShippingOptionPriceContext } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { readNativeStoreSettings, type SettingsConnection } from "../../lib/store-settings-db";
import { deliveryFee, deliverySubtotal } from "../../lib/store-settings";
// Keeps the existing manual_manual provider identity and fulfillment behavior.
export default class AmoonManualFulfillmentService extends ManualFulfillmentService {
  private settingsDb: SettingsConnection;
  constructor(dependencies: Record<string, unknown>) { super(); this.settingsDb = dependencies[ContainerRegistrationKeys.PG_CONNECTION] as SettingsConnection; }
  async canCalculate() { return true; }
  async calculatePrice(optionData: Record<string, unknown>, data: Record<string, unknown>, context: CalculateShippingOptionPriceContext) {
    if (!optionData.amoon_delivery_id) return super.calculatePrice(optionData, data, context);
    if (context.currency_code !== "mad") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cette livraison est disponible en MAD uniquement.");
    const { settings } = await readNativeStoreSettings(this.settingsDb);
    const option = settings.delivery.find(o => o.id === optionData.amoon_delivery_id);
    if (!option) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "La configuration de livraison doit être actualisée.");
    return { calculated_amount: deliveryFee(option, deliverySubtotal(context)), is_calculated_price_tax_inclusive: false };
  }
}
