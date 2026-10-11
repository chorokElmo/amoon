import type { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createApiKeysWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createStoresWorkflow, linkSalesChannelsToApiKeyWorkflow, updateStoresWorkflow, createStockLocationsWorkflow, linkSalesChannelsToStockLocationWorkflow, createLocationFulfillmentSetWorkflow, createServiceZonesWorkflow, createShippingOptionsWorkflow, createShippingProfilesWorkflow, updateRegionsWorkflow } from "@medusajs/medusa/core-flows";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type CatalogSettings = { region_id: string; sales_channel_id: string; publishable_key: string };

/** One entry point for store preconfiguration. Optional arguments: scope, preview. */
export default async function setupStore(input: ExecArgs) {
  const [scope = "all", mode, ...extra] = input.args || [];
  if (!["all", "core", "catalog", "checkout", "fashion"].includes(scope) ||
      (mode !== undefined && mode !== "preview") || extra.length) {
    throw new Error("Usage: medusa exec ./src/scripts/setup-store.ts [all|core|catalog|checkout|fashion] [preview]");
  }
  const preview = mode === "preview" || process.env.AMOON_SETUP_DRY_RUN === "true" || process.env.AMOON_TAXONOMY_DRY_RUN === "true";
  const catalog = ["all", "core", "catalog"].includes(scope);
  const checkout = ["all", "core", "checkout"].includes(scope);
  const fashion = ["all", "fashion"].includes(scope);
  if (checkout && (process.env.AMOON_DELIVERY_FEE ?? "0") !== "0") {
    throw new Error("This setup supports the configured free delivery only (AMOON_DELIVERY_FEE=0).");
  }
  if (preview) {
    if (catalog) console.log("Plan: create/reuse Morocco/MAD, store defaults, storefront channel and publishable key.");
    if (checkout) console.log("Plan: create/reuse stock location, Morocco shipping zone, free delivery and manual COD.");
    if (fashion) await setupFashionCatalog(input, true);
    console.log("Preview complete. No database or connection-file writes. Core steps are a plan, not a readiness check.");
    return;
  }
  const settings = catalog ? await setupCatalog(input) : undefined;
  if (checkout) await setupCheckout(input, settings);
  if (fashion) await setupFashionCatalog(input);
  console.log("Store setup complete. No products, stock quantities, customers or orders created.");
}

// Morocco, currency, store and sales channel
export async function setupCatalog({ container }: ExecArgs) {
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
  if (!keyScope[0]?.sales_channels?.some((linked: { id: string } | null) => linked?.id === channel.id)) await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } });
  const currencies = (store.supported_currencies || []).filter(currency => currency.currency_code !== "mad").map(currency => ({ currency_code: currency.currency_code, is_default: false }));
  await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { supported_currencies: [...currencies, { currency_code: "mad", is_default: true }], default_region_id: region.id, default_sales_channel_id: channel.id } } });
  const settings = { region_id: region.id, sales_channel_id: channel.id, publishable_key: key.token };
  await writeFile(path.resolve(process.cwd(), ".catalog-setup.json"), JSON.stringify(settings, null, 2), { mode: 0o600 });
  console.log("Amoon catalog configured: Morocco / MAD, storefront channel and publishable key. Connection values saved to .catalog-setup.json; no credentials printed.");
  return settings;
}

// Shipping, fulfillment and cash on delivery
export async function setupCheckout({ container }: ExecArgs, catalog?: CatalogSettings) {
  if ((process.env.AMOON_DELIVERY_FEE ?? "0") !== "0") throw new Error("Owner-approved free delivery requires AMOON_DELIVERY_FEE=0.");
  const settings: CatalogSettings = catalog ?? JSON.parse(await readFile(".catalog-setup.json", "utf8"));
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(Modules.FULFILLMENT);
  const locations = container.resolve(Modules.STOCK_LOCATION);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "payment_providers.id"], filters: { id: settings.region_id } });
  if (regions[0]?.currency_code !== "mad") throw new Error("MAD region required.");
  const providers = (regions[0].payment_providers || []).map((p: { id: string } | null) => p?.id).filter((id: string | undefined): id is string => !!id);
  if (!providers.includes("pp_system_default")) await updateRegionsWorkflow(container).run({ input: { selector: { id: settings.region_id }, update: { payment_providers: [...providers, "pp_system_default"] } } });
  const existing = await locations.listStockLocations({ name: "Amoon Collection" });
  if (existing.length > 1) throw new Error("Review duplicate Amoon locations.");
  let location = existing[0];
  if (!location) location = (await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: "Amoon Collection" }] } })).result[0];
  const { data: scope } = await query.graph({ entity: "stock_location", fields: ["id", "sales_channels.id", "fulfillment_providers.id", "fulfillment_sets.id", "fulfillment_sets.name"], filters: { id: location.id } });
  if (!scope[0]?.sales_channels?.some((c: { id: string } | null) => c?.id === settings.sales_channel_id)) await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [settings.sales_channel_id] } });
  if (!scope[0]?.fulfillment_providers?.some((p: { id: string } | null) => p?.id === "manual_manual")) await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } });
  let set = scope[0]?.fulfillment_sets?.find((s: { id: string; name: string } | null) => s?.name === "Amoon Livraison Maroc");
  if (!set) {
    await createLocationFulfillmentSetWorkflow(container).run({ input: { location_id: location.id, fulfillment_set_data: { name: "Amoon Livraison Maroc", type: "shipping" } } });
    const { data } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id", "fulfillment_sets.name"], filters: { id: location.id } });
    set = data[0]?.fulfillment_sets?.find((s: { id: string; name: string } | null) => s?.name === "Amoon Livraison Maroc");
  }
  if (!set) throw new Error("Fulfillment set missing.");
  const zones = await fulfillment.listServiceZones({ fulfillment_set: { id: set.id }, name: "Maroc" });
  if (zones.length > 1) throw new Error("Review duplicate Morocco zones.");
  const zone = zones[0] || (await createServiceZonesWorkflow(container).run({ input: { data: [{ name: "Maroc", fulfillment_set_id: set.id, geo_zones: [{ type: "country", country_code: "ma" }] }] } })).result[0];
  let profiles = await fulfillment.listShippingProfiles({ type: "default" });
  if (!profiles.length) {
    await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Amoon default shipping", type: "default" }] } });
    profiles = await fulfillment.listShippingProfiles({ type: "default" });
  }
  if (profiles.length !== 1) throw new Error("One default shipping profile required.");
  const options = await fulfillment.listShippingOptions({ service_zone: { id: zone.id }, name: "Livraison gratuite au Maroc" });
  if (options.length > 1) throw new Error("Review duplicate delivery options.");
  if (!options.length) await createShippingOptionsWorkflow(container).run({ input: [{ name: "Livraison gratuite au Maroc", service_zone_id: zone.id, shipping_profile_id: profiles[0].id, provider_id: "manual_manual", price_type: "flat", type: { label: "Livraison", code: "amoon-free-ma", description: "Livraison gratuite au Maroc" }, prices: [{ currency_code: "mad", amount: 0 }], rules: [{ attribute: "enabled_in_store", operator: "eq", value: "true" }, { attribute: "is_return", operator: "eq", value: "false" }] }] });
  console.log("Actual checkout configured: Morocco free delivery and manual COD. No inventory or orders created.");
}

// Fashion categories, product types, collections and tags
type CategoryNode = {
  name: string
  children?: CategoryNode[]
}

const leaf = (names: string[]): CategoryNode[] =>
  names.map((name) => ({ name }))

const categories: CategoryNode[] = [
  {
    name: "Women",
    children: [
      {
        name: "Clothing",
        children: leaf([
          "Dresses", "Tops & Blouses", "T-Shirts", "Shirts",
          "Jeans", "Trousers", "Skirts", "Jackets & Coats",
          "Knitwear", "Activewear", "Loungewear",
        ]),
      },
      {
        name: "Shoes",
        children: leaf([
          "Sneakers", "Heels", "Flats", "Boots", "Sandals",
        ]),
      },
      {
        name: "Bags",
        children: leaf([
          "Handbags", "Shoulder Bags", "Crossbody Bags",
          "Tote Bags", "Backpacks",
        ]),
      },
      {
        name: "Accessories",
        children: leaf([
          "Scarves", "Belts", "Sunglasses", "Hats", "Wallets",
        ]),
      },
    ],
  },
  {
    name: "Men",
    children: [
      {
        name: "Clothing",
        children: leaf([
          "T-Shirts", "Polo Shirts", "Shirts", "Jeans",
          "Trousers", "Shorts", "Hoodies & Sweatshirts",
          "Jackets & Coats", "Suits & Blazers", "Activewear",
        ]),
      },
      {
        name: "Shoes",
        children: leaf([
          "Sneakers", "Formal Shoes", "Boots", "Sandals",
        ]),
      },
      {
        name: "Accessories",
        children: leaf([
          "Belts", "Wallets", "Watches", "Caps",
          "Sunglasses", "Bags",
        ]),
      },
    ],
  },
  {
    name: "Jewelry",
    children: leaf([
      "Necklaces", "Earrings", "Bracelets",
      "Rings", "Jewelry Sets",
    ]),
  },
  {
    name: "Kids",
    children: [
      {
        name: "Girls",
        children: leaf(["Clothing", "Shoes", "Accessories"]),
      },
      {
        name: "Boys",
        children: leaf(["Clothing", "Shoes", "Accessories"]),
      },
      {
        name: "Baby",
        children: leaf(["Clothing", "Shoes"]),
      },
    ],
  },
]

const productTypes = [
  "T-Shirt", "Shirt", "Blouse", "Dress", "Jeans",
  "Trousers", "Skirt", "Hoodie", "Sweater", "Jacket",
  "Coat", "Blazer", "Shorts", "Polo Shirt",
  "Sneakers", "Boots", "Heels", "Sandals",
  "Flats", "Formal Shoes",
  "Handbag", "Tote Bag", "Crossbody Bag",
  "Backpack", "Wallet", "Belt", "Scarf",
  "Hat", "Cap", "Sunglasses", "Watch",
  "Necklace", "Earrings", "Ring",
  "Bracelet", "Jewelry Set",
]

const tags = [
  "new-arrival", "featured", "best-seller",
  "limited-edition", "clearance", "online-exclusive",
  "spring", "summer", "autumn", "winter", "all-season",
  "casual", "formal", "minimalist", "streetwear",
  "classic", "sporty", "elegant", "modest-fashion",
  "cotton", "linen", "denim", "wool",
  "leather", "faux-leather", "polyester",
  "workwear", "daily-wear", "wedding-guest",
  "party", "travel", "eid", "gift-idea",
  "slim-fit", "regular-fit", "oversized", "relaxed-fit",
  "unisex", "premium", "everyday-essential",
]

const collections = [
  { title: "New Arrivals", handle: "new-arrivals" },
  { title: "Best Sellers", handle: "best-sellers" },
  { title: "Autumn/Winter 2026", handle: "autumn-winter-2026" },
  { title: "Summer Essentials", handle: "summer-essentials" },
  { title: "Everyday Essentials", handle: "everyday-essentials" },
  { title: "Special Offers", handle: "special-offers" },
]

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// Read every page so reruns also reuse records in larger existing catalogs.
async function listAll<T>(page: (skip: number) => Promise<T[]>): Promise<T[]> {
  const result: T[] = []
  for (let skip = 0; ; skip += 250) {
    const records = await page(skip)
    result.push(...records)
    if (records.length < 250) return result
  }
}

export async function setupFashionCatalog({
  container,
}: ExecArgs, preview = false) {
  const product = container.resolve(Modules.PRODUCT)

  console.log(preview ? "Preview only: no records will be changed." : "Starting fashion catalog setup...")

  // Use complete category paths as handles to avoid
  // collisions such as Women/Shoes and Men/Shoes.
  const existingCategories = await listAll(skip => product.listProductCategories(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))

  const categoryByHandle = new Map<string, { id: string; parent_category_id?: string | null }>(
    existingCategories.map((c) => [c.handle, c])
  )

  async function createCategoryTree(
    nodes: CategoryNode[],
    parentId?: string,
    parentPath = ""
  ) {
    for (const node of nodes) {
      const segment = slugify(node.name)
      const handle = parentPath
        ? `${parentPath}-${segment}`
        : segment

      let category = categoryByHandle.get(handle)

      if (!category) {
        category = preview ? { id: `preview:${handle}`, parent_category_id: parentId } : await product.createProductCategories({
          name: node.name,
          handle,
          parent_category_id: parentId,
          is_active: true,
          is_internal: false,
        })

        categoryByHandle.set(handle, category)
        console.log(`${preview ? "Would create" : "Created"} category: ${handle}`)
      } else {
        console.log(`Exists category: ${handle}`)
        if ((category.parent_category_id ?? undefined) !== parentId) {
          throw new Error(
            `Existing category ${handle} has a different parent`
          )
        }
      }

      if (node.children?.length) {
        await createCategoryTree(
          node.children,
          category.id,
          handle
        )
      }
    }
  }

  await createCategoryTree(categories)

  // Product Types
  const existingTypes = await listAll(skip => product.listProductTypes(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const typeNames = new Set(
    existingTypes.map((t) => t.value.toLowerCase())
  )

  for (const value of productTypes) {
    if (typeNames.has(value.toLowerCase())) continue

    if (!preview) await product.createProductTypes({ value })
    typeNames.add(value.toLowerCase())
    console.log(`${preview ? "Would create" : "Created"} type: ${value}`)
  }

  // Product Tags
  const existingTags = await listAll(skip => product.listProductTags(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const tagNames = new Set(
    existingTags.map((t) => t.value.toLowerCase())
  )

  for (const value of tags) {
    if (tagNames.has(value.toLowerCase())) continue

    if (!preview) await product.createProductTags({ value })
    tagNames.add(value.toLowerCase())
    console.log(`${preview ? "Would create" : "Created"} tag: ${value}`)
  }

  // Product Collections
  const existingCollections = await listAll(skip => product.listProductCollections(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const collectionHandles = new Set(
    existingCollections.map((c) => c.handle)
  )

  for (const collection of collections) {
    if (collectionHandles.has(collection.handle)) continue

    if (!preview) await product.createProductCollections(collection)
    collectionHandles.add(collection.handle)
    console.log(`${preview ? "Would create" : "Created"} collection: ${collection.handle}`)
  }

  console.log(preview ? "Fashion catalog preview complete. No records changed." : "Fashion catalog setup completed. Existing records preserved; no products, variants, stock or prices created.")
}
