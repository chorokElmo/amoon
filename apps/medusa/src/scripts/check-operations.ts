import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { readFile } from "node:fs/promises";

/** Read-only operational report. Never outputs customer details or credentials. */
export default async function checkOperations({ container }: ExecArgs) {
  const settings = JSON.parse(await readFile(".catalog-setup.json", "utf8"));
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "countries.iso_2", "payment_providers.id"], filters: { id: settings.region_id } });
  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "is_disabled"], filters: { id: settings.sales_channel_id } });
  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "name", "address.address_1", "address.city", "address.country_code", "sales_channels.id", "fulfillment_providers.id"], filters: { name: "Amoon Collection" } });
  const { data: products } = await query.graph({ entity: "product", fields: ["id", "title", "status", "thumbnail", "images.id", "sales_channels.id", "variants.id", "variants.manage_inventory"], pagination: { take: 1000 } });
  const [, ownerCount] = await container.resolve(Modules.USER).listAndCountUsers({}, { take: 1 });
  const [, orderCount] = await container.resolve(Modules.ORDER).listAndCountOrders({}, { take: 1 });
  const { data: recentOrders } = await query.graph({ entity: "order", fields: ["id", "display_id", "currency_code", "total", "metadata", "payment_collections.status", "fulfillments.id", "shipping_methods.name", "shipping_methods.amount"], pagination: { take: 5, order: { created_at: "DESC" } } });
  const region = regions[0];
  const location = locations.length === 1 ? locations[0] : undefined;
  const published = products.filter(p => p.status === "published" && p.sales_channels?.some(c => c?.id === settings.sales_channel_id));
  const checks = {
    owner_account_exists: ownerCount > 0,
    morocco_mad_region: region?.currency_code === "mad" && !!region.countries?.some(c => c?.iso_2 === "ma"),
    manual_cod_linked: !!region?.payment_providers?.some(p => p?.id === "pp_system_default"),
    storefront_channel_enabled: channels.length === 1 && channels[0].is_disabled === false,
    unique_dispatch_location: !!location,
    location_channel_linked: !!location?.sales_channels?.some(c => c?.id === settings.sales_channel_id),
    manual_fulfillment_linked: !!location?.fulfillment_providers?.some(p => p?.id === "manual_manual"),
    dispatch_address_entered: !!(location?.address?.address_1 && location.address.city && location.address.country_code === "ma"),
  };
  console.log(JSON.stringify({ checks, published_products: published.length, existing_orders: orderCount,
    recent_orders: recentOrders.map(o => ({ reference: o.display_id, currency: o.currency_code, total: o.total,
      payment_collection_statuses: o.payment_collections?.map(p => p?.status) ?? [], fulfillment_count: o.fulfillments?.length ?? 0,
      cod_marked: o.metadata?.amoon_payment_method === "cash_on_delivery",
      delivery: o.shipping_methods?.map(s => ({ name: s?.name, amount: s?.amount })) })),
    catalog_review: published.map(p => ({ title: p.title, photographs_present: !!p.thumbnail || !!p.images?.length,
      unmanaged_variants: p.variants?.filter(v => v && !v.manage_inventory).length ?? 0 })),
    note: "Read-only. Missing dispatch details and unmanaged stock need owner review. Counts do not verify successful delivery or cash collection."
  }, null, 2));
}
