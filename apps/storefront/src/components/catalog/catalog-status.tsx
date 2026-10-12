import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export async function CatalogStatus({ title = "La boutique", action = "/boutique" }: { title?: string; action?: string }) {
  const t = await getTranslations();
  return <section className="catalog-unavailable container"><p className="eyebrow">Amoon Collection</p><h1>{t(title)}</h1><h2>{t("La sélection est momentanément indisponible.")}</h2><p>{t("Nous ne pouvons pas afficher les pièces pour le moment. Réessayez dans quelques instants ou contactez-nous pour connaître les disponibilités.")}</p><div className="contact-actions"><a className={buttonClass("outline")} href={action}>{t("Réessayer")}</a><Link className={buttonClass()} href="/contact">{t("Nous contacter")}</Link></div></section>;
}
export async function CatalogLoading() {
  const t = await getTranslations();
  return <section className="catalog-loading container" aria-busy="true" aria-label={t("Chargement du catalogue")}><p role="status">{t("Chargement des pièces…")}</p><div className="catalog-skeleton-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index}/>)}</div></section>;
}
