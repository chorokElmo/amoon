import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
// Run only after the owner supplies the actual price. Existing prices are preserved.
export default async function setProductPrice({ container }: ExecArgs) {
  const id = process.env.AMOON_VARIANT_ID; const amount = Number(process.env.AMOON_MAD_PRICE);
  if (!id?.startsWith("variant_") || !process.env.AMOON_MAD_PRICE || !Number.isFinite(amount) || amount < 0) throw new Error("Supply an actual variant ID and MAD price.");
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "product_variant", fields: ["id", "price_set.prices.*"], filters: { id } });
  if (data.length !== 1) throw new Error("Variant not found.");
  const prices = data[0].price_set?.prices || [];
  if (prices.length) { if (prices.length === 1 && prices[0]?.currency_code === "mad" && Number(prices[0]?.amount) === amount) return; throw new Error("Review existing prices in Admin; they will not be replaced."); }
  await updateProductVariantsWorkflow(container).run({ input: { product_variants: [{ id, prices: [{ currency_code: "mad", amount }] }] } });
  console.log("Owner-supplied MAD price saved.");
}
