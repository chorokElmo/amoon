import "server-only";
import { cookies } from "next/headers";
import { CART_COOKIE, readCartCookie } from "./cart-cookie";
import { medusaCart, CartError, type Cart } from "./medusa-cart";
import { catalogImageSource } from "@/components/catalog/catalog-image";
export function cartService() {
  if ((process.env.CART_COOKIE_SECRET || "").length < 32) throw new CartError("configuration");
  return medusaCart({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY || "", regionId: process.env.MEDUSA_REGION_ID || "", salesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID || "" });
}
export function cartImages(cart: Cart): Cart { return { ...cart, items: cart.items.map(item => ({ ...item, thumbnail: catalogImageSource(item.thumbnail) })) }; }
export async function currentCart(): Promise<Cart | null> {
  const service = cartService();
  const id = readCartCookie((await cookies()).get(CART_COOKIE)?.value, process.env.CART_COOKIE_SECRET || "");
  if (!id) return null;
  try { return cartImages(await service.get(id)); } catch (error) { if (error instanceof CartError && error.code === "missing") return null; throw error; }
}
