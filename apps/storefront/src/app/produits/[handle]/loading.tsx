import { getTranslations } from "@/lib/i18n-server";
export default async function ProductLoading() {
  const t = await getTranslations(); return <section className="container product-detail" aria-busy="true"><p role="status">{t("Chargement de la pièce…")}</p><div className="product-detail-layout catalog-skeleton-grid" aria-hidden="true"><div/><div/></div></section>; }
