import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
export type NativeShippingOption = { id: string; name: string; provider_id: string; price_type: string; data: Record<string, unknown> | null; prices?: { currency_code: string; amount: number; price_rules?: unknown[] }[] };
export type ShippingBackup = { name: string; data: Record<string, unknown>; amount: number };
export async function nativeShippingOptions(container: MedusaContainer): Promise<NativeShippingOption[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "shipping_option", fields: ["id", "name", "provider_id", "price_type", "data", "prices.*", "prices.price_rules.*"] });
  return data as unknown as NativeShippingOption[];
}
export function manageableShipping(option: NativeShippingOption) {
  return option.provider_id === "manual_manual" && (option.data?.amoon_delivery_id === option.id || option.price_type === "flat" && option.prices?.length === 1 && option.prices[0].currency_code === "mad" && !(option.prices[0].price_rules?.length));
}
