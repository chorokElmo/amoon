import { getTranslations } from "@/lib/i18n-server";
export default async function LoadingCheckout() {
  const t = await getTranslations(); return <section className="container cart-page" aria-busy="true"><h1>{t("Votre commande")}</h1><p role="status">{t("Chargement de votre commande…")}</p></section>; }
