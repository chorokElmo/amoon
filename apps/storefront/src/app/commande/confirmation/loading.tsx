import { getTranslations } from "@/lib/i18n-server";
export default async function Loading() { const t = await getTranslations(); return <section className="container cart-page" aria-busy="true"><p role="status">{t("Chargement de la confirmation…")}</p></section>; }
