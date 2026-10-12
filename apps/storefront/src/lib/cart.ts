import "server-only";
import { cookies } from "next/headers";
import { CART_COOKIE, readCartCookie } from "./cart-cookie";
import { medusaCart, CartError, type Cart } from "./medusa-cart";
import { catalogImageSource } from "@/components/catalog/catalog-image";
import { getCatalog } from "./catalog";
import { getLanguage, getTranslations } from "./i18n-server";
export function cartService() {
  if ((process.env.CART_COOKIE_SECRET || "").length < 32) throw new CartError("configuration");
  return medusaCart({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY || "", regionId: process.env.MEDUSA_REGION_ID || "", salesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID || "" });
}
export async function cartImages(cart: Cart): Promise<Cart> {
  const language = await getLanguage();
  const catalog = language === "ar" && cart.items.length ? await getCatalog() : null;
  const t = await getTranslations();
  return { ...cart, items: cart.items.map(item => {
    const product = catalog?.ok ? catalog.data.products.find(product => product.id === item.productId) : null;
    const variant = product?.variants.find(variant => variant.id === item.variantId);
    const translatedVariant = product?.translations?.ar?.variants?.[item.variantId];
    const label = variant?.options.length && item.variant !== "Default variant" ? variant.options.map(option => t(option.name) + " : " + t(option.value)).join(" · ") : item.variant;
    return { ...item, title: product?.title || item.title, variant: translatedVariant || label, thumbnail: catalogImageSource(item.thumbnail) };
  }) };
}
export async function currentCart(): Promise<Cart | null> {
  const service = cartService();
  const id = readCartCookie((await cookies()).get(CART_COOKIE)?.value, process.env.CART_COOKIE_SECRET || "");
  if (!id) return null;
  try { return cartImages(await service.get(id)); } catch (error) { if (error instanceof CartError && error.code === "missing") return null; throw error; }
}
