import "server-only";
import { cookies } from "next/headers";
import { CART_COOKIE, readCartCookie } from "./cart-cookie";
import { medusaCheckout, type Checkout } from "./medusa-checkout";
import { proof, validProof, CheckoutError } from "./checkout-model";
import { cartImages } from "./cart";
export const RECEIPT_COOKIE = "amoon_order";
export function checkoutService() { return medusaCheckout({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY || "", regionId: process.env.MEDUSA_REGION_ID || "", salesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID || "" }, process.env.CART_COOKIE_SECRET || ""); }
export async function checkoutCartId() { return readCartCookie((await cookies()).get(CART_COOKIE)?.value, process.env.CART_COOKIE_SECRET || ""); }
export function checkoutImages(state: Checkout) { return { ...state, cart: cartImages(state.cart) }; }
export function receiptCookie(id: string) { if (!/^order_[a-zA-Z0-9]+$/.test(id)) throw new CheckoutError("Confirmation indisponible.", 503); return id + "." + proof({ orderId: id }, process.env.CART_COOKIE_SECRET || "", Math.floor(Date.now() / 1000) + 86400); }
export async function currentReceipt() {
  const value = (await cookies()).get(RECEIPT_COOKIE)?.value || ""; const parts = value.split(".");
  if (parts.length !== 3 || !/^order_[a-zA-Z0-9]+$/.test(parts[0]) || !validProof(parts.slice(1).join("."), { orderId: parts[0] }, process.env.CART_COOKIE_SECRET || "")) return null;
  return checkoutService().receipt(parts[0]);
}
