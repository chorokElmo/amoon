import { getTranslations } from "@/lib/i18n-server";
export default async function LoadingCart() {
  const t = await getTranslations(); return <section className="container cart-page" aria-busy="true"><p className="eyebrow">Amoon Collection</p><h1>{t("Votre panier")}</h1><p role="status">{t("Chargement de votre panier…")}</p></section>; }
