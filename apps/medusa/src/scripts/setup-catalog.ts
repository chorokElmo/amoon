import type { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createApiKeysWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createStoresWorkflow, linkSalesChannelsToApiKeyWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export default async function setupCatalog({ container }: ExecArgs) {
  const regions = container.resolve(Modules.REGION);
  const channels = container.resolve(Modules.SALES_CHANNEL);
  const apiKeys = container.resolve(Modules.API_KEY);
  const stores = container.resolve(Modules.STORE);
  const existingRegions = await regions.listRegions({}, { relations: ["countries"], take: 1000 });
  const morocco = existingRegions.filter(region => region.countries?.some(country => country.iso_2 === "ma"));
  if (morocco.length > 1 || morocco.some(region => region.currency_code !== "mad")) throw new Error("Morocco is already assigned to another region. Review it in Admin before setup; no countries were moved.");
  const storeList = await stores.listStores({}, { relations: ["supported_currencies"] });
  if (storeList.length > 1) throw new Error("Expected one Medusa store; review store configuration before setup.");
  let store = storeList[0];
  if (!store) {
    const { result } = await createStoresWorkflow(container).run({ input: { stores: [{ name: "Amoon Collection", supported_currencies: [{ currency_code: "mad", is_default: true }] }] } });
    store = result[0];
  }
  let region = morocco[0];
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({ input: { regions: [{ name: "Maroc", currency_code: "mad", countries: ["ma"] }] } });
    region = result[0];
  }
  const channelName = "Amoon Storefront";
  const existingChannels = await channels.listSalesChannels({ name: channelName });
  if (existingChannels.length > 1) throw new Error("Multiple Amoon Storefront channels exist; review them in Admin.");
  let channel = existingChannels[0];
  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: channelName, description: "Boutique en ligne Amoon Collection" }] } });
    channel = result[0];
  }
  if (channel.is_disabled) throw new Error("Amoon Storefront is disabled; enable it in Admin before setup.");
  const title = "Amoon Storefront Publishable";
  const existingKeys = (await apiKeys.listApiKeys({ title, type: "publishable" })).filter(key => !key.revoked_at);
  if (existingKeys.length > 1) throw new Error("Multiple active Amoon publishable keys exist; review them in Admin.");
  let key = existingKeys[0];
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title, type: "publishable", created_by: "amoon-catalog-setup" }] } });
    key = result[0];
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: keyScope } = await query.graph({ entity: "api_key", fields: ["id", "sales_channels.id"], filters: { id: key.id } });
  if (!keyScope[0]?.sales_channels?.some(linked => linked?.id === channel.id)) await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } });
  const currencies = (store.supported_currencies || []).filter(currency => currency.currency_code !== "mad").map(currency => ({ currency_code: currency.currency_code, is_default: false }));
  await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { supported_currencies: [...currencies, { currency_code: "mad", is_default: true }], default_region_id: region.id, default_sales_channel_id: channel.id } } });
  await writeFile(path.resolve(process.cwd(), ".catalog-setup.json"), JSON.stringify({ region_id: region.id, sales_channel_id: channel.id, publishable_key: key.token }, null, 2), { mode: 0o600 });
  console.log("Amoon catalog configured: Morocco / MAD, storefront channel and publishable key. Connection values saved to .catalog-setup.json; no credentials printed.");
}
