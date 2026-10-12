import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import { currentCart } from "@/lib/cart";
import { CartView } from "@/components/cart/cart-view";
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata({ title: t("Panier"), robots: { index: false, follow: false } }, await getLanguage());
}
export default async function CartPage() {
  try { const cart = await currentCart(); return <CartView key={cart ? cart.id + cart.items.map(i => i.id + ":" + i.quantity).join(",") : "empty"} initialCart={cart} unavailable={false}/>; }
  catch { return <CartView initialCart={null} unavailable/>; }
}
