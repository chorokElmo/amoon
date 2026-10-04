import type { Cart, CartAction } from "./medusa-cart";
export async function changeCart(action: CartAction): Promise<Cart> {
  const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action), cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.cart) throw new Error(data.error || "Actualisez le panier avant de réessayer.");
  window.dispatchEvent(new Event("amoon:cart")); return data.cart;
}
