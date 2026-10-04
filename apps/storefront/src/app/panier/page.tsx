import { currentCart } from "@/lib/cart";
import { CartView } from "@/components/cart/cart-view";
export const metadata = { title: "Panier", robots: { index: false, follow: false } };
export default async function CartPage() {
  try { const cart = await currentCart(); return <CartView key={cart ? cart.id + cart.items.map(i => i.id + ":" + i.quantity).join(",") : "empty"} initialCart={cart} unavailable={false}/>; }
  catch { return <CartView initialCart={null} unavailable/>; }
}
