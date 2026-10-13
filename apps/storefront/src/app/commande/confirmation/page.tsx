import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import Link from "next/link";
import { currentReceipt } from "@/lib/checkout";
import { getStoreConfig } from "@/lib/store-config";
import { formatMad } from "@/lib/catalog-model";
import { CatalogImage } from "@/components/catalog/catalog-image";
import { Icon } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import styles from "./confirmation.module.css";
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata({ title: t("Confirmation de commande"), robots: { index: false, follow: false } }, await getLanguage());
}
export default async function Confirmation() {
  const t = await getTranslations();
  try {
    const order = await currentReceipt();
    if (!order) return <section className="container cart-page"><h1>{t("Confirmation indisponible")}</h1><p>{t("Retrouvez votre confirmation depuis la commande passée dans ce navigateur.")}</p><Link className={buttonClass()} href="/commande">{t("Retrouver ma commande")}</Link></section>;
    const config = await getStoreConfig();
    const canceled = order.progress === "Commande annulée";
    const visual = order.items.find(item => item.thumbnail);
    return <section className={styles.page + " container"}>
      <header className={styles.header}><div className={styles.headerCopy}><div className={styles.check} aria-hidden="true">{canceled ? "×" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 12 4 4L19 6"/></svg>}</div><p className="eyebrow">Amoon Collection</p><h1>{canceled ? t("Commande annulée") : t("Votre commande est enregistrée !")}</h1><p>{canceled ? t("Contactez-nous pour toute question concernant cette commande.") : t("Merci pour votre confiance. Nous avons bien reçu votre commande et elle est en cours de traitement.")}</p></div>{visual && <div className={styles.heroPhoto}><CatalogImage src={visual.thumbnail} alt={visual.title} sizes="(max-width: 760px) 0px, 30vw"/></div>}</header>
      <dl className={styles.summary}><div><Icon name="bag"/><dt>{t("Référence de commande")}</dt><dd><bdi dir="ltr">{order.number}</bdi></dd></div><div><Icon name="card"/><dt>{t("Mode de paiement")}</dt><dd>{t(order.payment || "Mode de paiement à confirmer")}{order.paymentStatus && <small className={styles.paymentStatus}>{t(order.paymentStatus)}</small>}</dd></div><div><Icon name="truck"/><dt>{t("Montant total")}</dt><dd>{formatMad(order.total)}</dd></div></dl>
      <div className={styles.grid}><section className={styles.card}><h2>{t("Détails de votre commande")}</h2>{order.items.map(item => <article className={styles.item} key={item.id}><div className={styles.photo}><CatalogImage src={item.thumbnail} alt={item.title} sizes="80px"/></div><div><h3>{item.title}</h3>{item.options.length ? item.options.map(option => <p key={option.name}>{t(option.name)}: {t(option.value)}</p>) : item.variant && <p>{t(item.variant)}</p>}<p>{t("Quantité")}: {item.quantity ?? "—"}</p></div>{item.total !== null && <strong>{formatMad(item.total)}</strong>}</article>)}{!order.items.length && <p>{t("Les détails des articles sont momentanément indisponibles.")}</p>}<dl className={styles.totals}>{[["Sous-total",order.subtotal],["Livraison",order.shipping],["Réduction",order.discount && order.discount > 0 ? order.discount : null]].map(([label,value]) => typeof value === "number" && <div key={String(label)}><dt>{t(String(label))}</dt><dd>{formatMad(value)}</dd></div>)}<div><dt>{t("Total")}</dt><dd><strong>{formatMad(order.total)}</strong></dd></div></dl></section>
      <section className={styles.card}><h2>{t("Informations de livraison")}</h2>{order.address ? <dl className={styles.delivery}>{[["Nom complet",order.address.name],["Téléphone",order.address.phone],["Ville",order.address.city],["Adresse de livraison",order.address.lines],["Instructions",order.instructions]].map(([label,value]) => value && <div key={label}><dt>{t(label)}</dt><dd>{label === "Téléphone" ? <bdi dir="ltr">{value}</bdi> : value}</dd></div>)}</dl> : <p>{t("Les informations de livraison sont momentanément indisponibles.")}</p>}</section></div>
      <div className={styles.actions}><Link className={buttonClass()} href="/boutique"><Icon name="bag"/>{t("Continuer mes achats")}<Icon name="arrow"/></Link>{config.whatsappUrl ? <a className={buttonClass("outline")} href={config.whatsappUrl + "?text=" + encodeURIComponent(t("Bonjour Amoon Collection, je souhaite des renseignements sur ma commande ") + order.number)} target="_blank" rel="noopener noreferrer">{t("Nous contacter sur WhatsApp")}</a> : <Link className={buttonClass("outline")} href="/contact">{t("Nous contacter")}</Link>}</div>
      <section className={styles.progress} aria-label={t("État de la commande")}><span className={styles.check} aria-hidden="true"><Icon name="bag"/></span><div><h2>{t(order.progress)}</h2><p>{t("Conservez cette référence pour toute question concernant votre commande.")}</p></div></section>
    </section>;
  } catch { return <section className="container cart-page"><h1>{t("Confirmation momentanément indisponible")}</h1><p>{t("Votre commande peut déjà être enregistrée. Retrouvez sa confirmation avant de recommander.")}</p><Link className={buttonClass()} href="/commande">{t("Vérifier ma commande")}</Link></section>; }
}