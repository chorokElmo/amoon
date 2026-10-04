import type { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStockLocationsWorkflow, linkSalesChannelsToStockLocationWorkflow, createLocationFulfillmentSetWorkflow, createServiceZonesWorkflow, createShippingOptionsWorkflow, updateRegionsWorkflow } from "@medusajs/medusa/core-flows";
import { readFile } from "node:fs/promises";
export default async function setupCheckout({ container }: ExecArgs) {
  if (process.env.AMOON_DELIVERY_FEE !== "0") throw new Error("Owner-approved free delivery requires AMOON_DELIVERY_FEE=0.");
  const settings = JSON.parse(await readFile(".catalog-setup.json", "utf8"));
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(Modules.FULFILLMENT);
  const locations = container.resolve(Modules.STOCK_LOCATION);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "payment_providers.id"], filters: { id: settings.region_id } });
  if (regions[0]?.currency_code !== "mad") throw new Error("MAD region required.");
  const providers = (regions[0].payment_providers || []).map(p => p?.id).filter((id): id is string => !!id);
  if (!providers.includes("pp_system_default")) await updateRegionsWorkflow(container).run({ input: { selector: { id: settings.region_id }, update: { payment_providers: [...providers, "pp_system_default"] } } });
  const existing = await locations.listStockLocations({ name: "Amoon Collection" });
  if (existing.length > 1) throw new Error("Review duplicate Amoon locations.");
  let location = existing[0];
  if (!location) location = (await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: "Amoon Collection" }] } })).result[0];
  const { data: scope } = await query.graph({ entity: "stock_location", fields: ["id", "sales_channels.id", "fulfillment_providers.id", "fulfillment_sets.id", "fulfillment_sets.name"], filters: { id: location.id } });
  if (!scope[0]?.sales_channels?.some(c => c?.id === settings.sales_channel_id)) await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [settings.sales_channel_id] } });
  if (!scope[0]?.fulfillment_providers?.some(p => p?.id === "manual_manual")) await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } });
  let set = scope[0]?.fulfillment_sets?.find(s => s?.name === "Amoon Livraison Maroc");
  if (!set) {
    await createLocationFulfillmentSetWorkflow(container).run({ input: { location_id: location.id, fulfillment_set_data: { name: "Amoon Livraison Maroc", type: "shipping" } } });
    const { data } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id", "fulfillment_sets.name"], filters: { id: location.id } });
    set = data[0]?.fulfillment_sets?.find(s => s?.name === "Amoon Livraison Maroc");
  }
  if (!set) throw new Error("Fulfillment set missing.");
  const zones = await fulfillment.listServiceZones({ fulfillment_set: { id: set.id }, name: "Maroc" });
  if (zones.length > 1) throw new Error("Review duplicate Morocco zones.");
  const zone = zones[0] || (await createServiceZonesWorkflow(container).run({ input: { data: [{ name: "Maroc", fulfillment_set_id: set.id, geo_zones: [{ type: "country", country_code: "ma" }] }] } })).result[0];
  const profiles = await fulfillment.listShippingProfiles({ type: "default" });
  if (profiles.length !== 1) throw new Error("One default shipping profile required.");
  const options = await fulfillment.listShippingOptions({ service_zone: { id: zone.id }, name: "Livraison gratuite au Maroc" });
  if (options.length > 1) throw new Error("Review duplicate delivery options.");
  if (!options.length) await createShippingOptionsWorkflow(container).run({ input: [{ name: "Livraison gratuite au Maroc", service_zone_id: zone.id, shipping_profile_id: profiles[0].id, provider_id: "manual_manual", price_type: "flat", type: { label: "Livraison", code: "amoon-free-ma", description: "Livraison gratuite au Maroc" }, prices: [{ currency_code: "mad", amount: 0 }], rules: [{ attribute: "enabled_in_store", operator: "eq", value: "true" }, { attribute: "is_return", operator: "eq", value: "false" }] }] });
  console.log("Actual checkout configured: Morocco free delivery and manual COD. No inventory or orders created.");
}
