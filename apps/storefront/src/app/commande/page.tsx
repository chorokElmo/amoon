import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import { checkoutCartId, checkoutService, checkoutImages } from "@/lib/checkout";
import { CheckoutForm } from "@/components/cart/checkout-form";
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata({ title: t("Votre commande"), robots: { index: false, follow: false } }, await getLanguage());
}
export default async function CheckoutPage() { try { const id = await checkoutCartId(); const state = id ? await checkoutImages(await checkoutService().snapshot(id)) : null; return <CheckoutForm key={state ? state.cart.id + ":" + state.cart.total : "empty"} initial={state} unavailable={false}/>; } catch { return <CheckoutForm initial={null} unavailable/>; } }
