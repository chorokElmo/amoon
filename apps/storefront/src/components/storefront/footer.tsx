import Link from "next/link";
import { fr } from "@/lib/i18n";
import { getStoreConfig } from "@/lib/store-config";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "./wordmark";
import type { LogoImage } from "./wordmark";
import { Botanical } from "./botanical";
export async function Footer({ logo }: { logo?: LogoImage }) {
  const storeConfig = await getStoreConfig();
  return <footer className="store-footer"><Botanical/><div className="container footer-grid">
    <div className="footer-brand" style={{whiteSpace:"pre-line"}}><Wordmark logo={logo}/><p>{storeConfig.settings.info.description}</p></div>
    <div><h2>La boutique</h2><nav aria-label="Navigation de pied de page">{fr.navigation.slice(1, 4).map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
    <div><h2>Informations</h2><nav aria-label="Informations pratiques"><Link href="/informations#livraison">Livraison</Link><Link href="/informations#retours">Retours</Link><Link href="/informations#faq">Questions fréquentes</Link><Link href="/informations#commande">Conditions de commande</Link><Link href="/informations#confidentialite">Confidentialité</Link></nav></div>
    <div><h2>Restons proches</h2><p>Nos pièces, nos inspirations<br/>et les dernières collections.</p>{storeConfig.instagramUrl && <a href={storeConfig.instagramUrl} className="social-link" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/> Instagram</a>}<Link href="/contact">Contacter {storeConfig.settings.info.name === "Amoon Collection" ? "Amoon" : storeConfig.settings.info.name}</Link>{storeConfig.facebookUrl && <a href={storeConfig.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>}{storeConfig.tiktokUrl && <a href={storeConfig.tiktokUrl} target="_blank" rel="noopener noreferrer">TikTok</a>}{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {storeConfig.settings.info.name === "Amoon Collection" ? "Amoon" : storeConfig.settings.info.name}. Tous droits réservés.</span><div><Link href="/informations#commande">Conditions de vente</Link><Link href="/informations#confidentialite">Politique de confidentialité</Link></div></div></footer>;
}
