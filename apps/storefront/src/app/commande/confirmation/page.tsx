import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import Link from "next/link";
import { currentReceipt } from "@/lib/checkout";
import { formatMad } from "@/lib/catalog-model";
import { buttonClass } from "@/components/ui/button";
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata({ title: t("Confirmation de commande"), robots: { index: false, follow: false } }, await getLanguage());
}
export default async function Confirmation() {
  const t = await getTranslations();
  try {
    const order = await currentReceipt();
    if (!order) return <section className="container cart-page"><h1>{t("Confirmation indisponible")}</h1><p>{t("Retrouvez votre confirmation depuis la commande passée dans ce navigateur.")}</p><Link className={buttonClass()} href="/commande">{t("Retrouver ma commande")}</Link></section>;
    return <section className="container cart-page"><p className="eyebrow">Amoon Collection</p><h1>{t("Votre commande est enregistrée.")}</h1><p>{t("Référence : ")}<strong><bdi dir="ltr">{order.number}</bdi></strong></p><p>{t("Paiement choisi : espèces à la livraison. Montant de la commande : ")}<strong>{formatMad(order.total)}</strong>.</p><p>{t("Conservez cette référence pour toute question concernant votre commande.")}</p><div className="checkout-confirmation-links"><Link className={buttonClass()} href="/boutique">{t("Continuer mes achats")}</Link><Link className="text-link" href="/contact">{t("Nous contacter")}</Link></div></section>;
  } catch { return <section className="container cart-page"><h1>{t("Confirmation momentanément indisponible")}</h1><p>{t("Votre commande peut déjà être enregistrée. Retrouvez sa confirmation avant de recommander.")}</p><Link className={buttonClass()} href="/commande">{t("Vérifier ma commande")}</Link></section>; }
}
