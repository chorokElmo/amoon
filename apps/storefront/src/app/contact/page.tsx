import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { localizeMetadata } from "@/lib/i18n-metadata";
import { catalogMetadata } from "@/lib/seo";
import { getStoreConfig } from "@/lib/store-config";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
export async function generateMetadata() {
  const t = await getTranslations();
  return localizeMetadata(catalogMetadata(t("Contact"), t("Contactez Amoon Collection pour un conseil sur nos vêtements, les tailles ou votre commande au Maroc."), "/contact", {}), await getLanguage());
}
export default async function Contact() {
  const t = await getTranslations();
  const storeConfig = await getStoreConfig();
  return <section className="contact-page container"><p className="eyebrow">{t("À votre écoute")}</p><h1>{t("Parlons de votre")}<br/><em>{t("prochaine pièce.")}</em></h1><p>{t("Une question sur une taille, une couleur ou une disponibilité ?")}<br/>{t("Écrivez-nous, nous vous accompagnerons dans votre choix.")}</p><div className="contact-actions">{storeConfig.instagramUrl && <a href={storeConfig.instagramUrl} className={buttonClass()} target="_blank" rel="noopener noreferrer"><Icon name="instagram"/>{t("Nous écrire sur Instagram")}</a>}{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} className={buttonClass("outline")} target="_blank" rel="noopener noreferrer">{t("Nous écrire sur WhatsApp")}<Icon name="arrow"/></a>}</div><div className="contact-store-details" style={{whiteSpace:"pre-line",marginTop:24}}>{storeConfig.settings.info.email && <p><a href={"mailto:"+storeConfig.settings.info.email}>{storeConfig.settings.info.email}</a></p>}{storeConfig.settings.info.phone && <p><a href={"tel:+"+storeConfig.settings.info.phone.replace(/^\+/,"")}>{storeConfig.settings.info.phone}</a></p>}{storeConfig.settings.info.address && <p>{storeConfig.settings.info.address}</p>}{storeConfig.facebookUrl && <p><a href={storeConfig.facebookUrl} target="_blank" rel="noopener noreferrer">{t("Facebook")}</a></p>}{storeConfig.tiktokUrl && <p><a href={storeConfig.tiktokUrl} target="_blank" rel="noopener noreferrer">{t("TikTok")}</a></p>}</div></section>;
}
