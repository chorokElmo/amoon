import { checkoutCartId, checkoutService, checkoutImages } from "@/lib/checkout";
import { CheckoutForm } from "@/components/cart/checkout-form";
export const metadata = { title: "Votre commande", robots: { index: false, follow: false } };
export default async function CheckoutPage() { try { const id = await checkoutCartId(); const state = id ? checkoutImages(await checkoutService().snapshot(id)) : null; return <CheckoutForm key={state ? state.cart.id + ":" + state.cart.total : "empty"} initial={state} unavailable={false}/>; } catch { return <CheckoutForm initial={null} unavailable/>; } }
