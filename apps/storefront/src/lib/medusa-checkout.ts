import { list, record, text } from "./catalog-model";
import { medusaCart, normalizeCart, type Cart, type CartConfig } from "./medusa-cart";
import { parseCustomer, proof, validProof, CheckoutError, type Customer } from "./checkout-model";
export type ShippingChoice = { id: string; name: string; amount: number };
export type Checkout = { cart: Cart; customer: Customer | null; options: ShippingChoice[]; selectedShipping: string | null; shipping: number; cod: boolean; review: string | null; completed: boolean };
export type Receipt = { id: string; number: string; total: number; currency: "mad" };
const amount = (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new CheckoutError("Les montants sont indisponibles.", 503); return v; };
export function orderReceipt(input: unknown): Receipt {
  const o = record(input); if (!/^order_[a-zA-Z0-9]+$/.test(text(o.id)) || o.currency_code !== "mad") throw new CheckoutError("La confirmation est indisponible.", 503);
  return { id: text(o.id), number: text(o.custom_display_id) || String(o.display_id || o.id), total: amount(o.total), currency: "mad" };
}
export function medusaCheckout(config: CartConfig, secret: string, transport: typeof fetch = fetch) {
  const service = medusaCart(config, transport);
  const base = (id: string) => "/store/carts/" + encodeURIComponent(id);
  async function raw(id: string) {
    const c = record((await service.request(base(id))).cart);
    if (c.region_id !== config.regionId || c.sales_channel_id !== config.salesChannelId || c.currency_code !== "mad") throw new CheckoutError("Ce panier ne correspond pas à la boutique.");
    return c;
  }
  async function snapshot(id: string): Promise<Checkout> {
    const c = await raw(id); const completed = !!c.completed_at;
    const cart = normalizeCart({ ...c, completed_at: null }, config);
    let customer: Customer | null = null;
    try { customer = parseCustomer({ email: c.email, address: c.shipping_address }); } catch { /* Address is legitimately incomplete until the customer submits it. */ }
    const selectedShipping = text(record(list(c.shipping_methods)[0]).shipping_option_id) || null;
    const shipping = amount(c.shipping_total);
    const providers = list((await service.request("/store/payment-providers?region_id=" + encodeURIComponent(config.regionId))).payment_providers);
    const cod = providers.some(p => record(p).id === "pp_system_default" && record(p).is_enabled !== false);
    const options: ShippingChoice[] = completed ? [] : list((await service.request("/store/shipping-options?limit=100&cart_id=" + encodeURIComponent(id))).shipping_options).filter(v => {
      const o = record(v); return o.price_type === "flat" && typeof o.amount === "number" && Number.isFinite(o.amount) && o.amount >= 0;
    }).map(v => { const o = record(v); return { id: text(o.id), name: text(o.name), amount: amount(o.amount) }; });
    const state: Checkout = { cart, customer, options, selectedShipping, shipping, cod, review: null, completed };
    if (!completed && customer && cart.items.length && cod && options.some(o => o.id === selectedShipping)) state.review = proof(reviewData(state), secret);
    return state;
  }
  return {
    snapshot,
    async address(id: string, input: unknown) {
      const customer = parseCustomer(input); const c = await raw(id);
      if (c.completed_at || !list(c.items).length) throw new CheckoutError("Ce panier ne peut plus être modifié.");
      await service.request(base(id), "POST", { email: customer.email, shipping_address: customer.address, billing_address: customer.address, metadata: { ...record(c.metadata), amoon_payment_method: "cash_on_delivery" } });
      return snapshot(id);
    },
    async shipping(id: string, optionId: unknown) {
      const state = await snapshot(id);
      if (state.completed || !state.customer || !state.options.some(o => o.id === optionId)) throw new CheckoutError("Choisissez une livraison disponible pour votre adresse.");
      await service.request(base(id) + "/shipping-methods", "POST", { option_id: optionId });
      return snapshot(id);
    },
    async complete(id: string, token: unknown, consent: unknown): Promise<Receipt> {
      if (consent !== true) throw new CheckoutError("Confirmez votre commande avec paiement à la livraison.", 400);
      const c = await raw(id);
      if (c.completed_at) return completedOrder(id);
      let state = await snapshot(id);
      if (!state.review || !validProof(token, reviewData(state), secret)) throw new CheckoutError("Le panier a changé ou le récapitulatif a expiré. Vérifiez à nouveau votre commande.");
      for (const item of state.cart.items) await service.eligible(item.productId, item.variantId);
      const collection = record((await service.request("/store/payment-collections", "POST", { cart_id: id })).payment_collection);
      if (!text(collection.id) || amount(collection.amount) !== state.cart.total) throw new CheckoutError("Le total du paiement a changé. Actualisez la commande.");
      const sessions = list(collection.payment_sessions);
      if (!sessions.some(s => record(s).provider_id === "pp_system_default" && record(s).amount === state.cart.total && record(s).currency_code === "mad" && ["pending", "authorized"].includes(text(record(s).status)))) {
        await service.request("/store/payment-collections/" + encodeURIComponent(text(collection.id)) + "/payment-sessions", "POST", { provider_id: "pp_system_default", data: { payment_method: "cash_on_delivery" } });
      }
      state = await snapshot(id);
      if (!state.review || !validProof(token, reviewData(state), secret)) throw new CheckoutError("Le panier a changé. Vérifiez à nouveau votre commande.");
      return completedOrder(id);
    },
    async receipt(id: string) { return orderReceipt((await service.request("/store/orders/" + encodeURIComponent(id))).order); },
  };
  async function completedOrder(id: string) {
    const result = await service.request(base(id) + "/complete", "POST", {});
    if (result.type !== "order") throw new CheckoutError("La commande n’a pas été confirmée. Vérifiez le panier avant de réessayer.");
    return orderReceipt(result.order);
  }
}
export function reviewData(state: Checkout) { return { cart: { ...state.cart, items: [...state.cart.items].sort((a, b) => a.id.localeCompare(b.id)) }, customer: state.customer, selectedShipping: state.selectedShipping, shipping: state.shipping, cod: state.cod }; }
