import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { fr } from "@/lib/i18n";
import { getStoreConfig } from "@/lib/store-config";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "./wordmark";
import type { LogoImage } from "./wordmark";
import { Botanical } from "./botanical";
export async function Footer({ logo }: { logo?: LogoImage }) {
  const t = await getTranslations();
  const storeConfig = await getStoreConfig();
  return <footer className="store-footer"><Botanical/><div className="container footer-grid">
    <div className="footer-brand" style={{whiteSpace:"pre-line"}}><Wordmark logo={logo} eager={false}/><p>{t(storeConfig.settings.info.description)}</p></div>
    <div><h2>{t("La boutique")}</h2><nav aria-label={t("Navigation de pied de page")}>{fr.navigation.slice(1, 4).map(item => <Link key={item.href} href={item.href}>{t(item.label)}</Link>)}</nav></div>
    <div><h2>{t("Informations")}</h2><nav aria-label={t("Informations pratiques")}><Link href="/informations#livraison">{t("Livraison")}</Link><Link href="/informations#retours">{t("Retours")}</Link><Link href="/informations#faq">{t("Questions fréquentes")}</Link><Link href="/informations#commande">{t("Conditions de commande")}</Link><Link href="/informations#confidentialite">{t("Confidentialité")}</Link></nav></div>
    <div><h2>{t("Restons proches")}</h2><p>{t("Nos pièces, nos inspirations")}<br/>{t("et les dernières collections.")}</p>{storeConfig.instagramUrl && <a href={storeConfig.instagramUrl} className="social-link" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/> {t("Instagram")}</a>}<Link href="/contact">{t("Contacter ")}{storeConfig.settings.info.name === "Amoon Collection" ? "Amoon" : storeConfig.settings.info.name}</Link>{storeConfig.facebookUrl && <a href={storeConfig.facebookUrl} target="_blank" rel="noopener noreferrer">{t("Facebook")}</a>}{storeConfig.tiktokUrl && <a href={storeConfig.tiktokUrl} target="_blank" rel="noopener noreferrer">{t("TikTok")}</a>}{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">{t("WhatsApp")}</a>}</div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {storeConfig.settings.info.name === "Amoon Collection" ? "Amoon" : storeConfig.settings.info.name}{t(". Tous droits réservés.")}</span><div><Link href="/informations#commande">{t("Conditions de vente")}</Link><Link href="/informations#confidentialite">{t("Politique de confidentialité")}</Link></div></div></footer>;
}
