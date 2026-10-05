import Link from "next/link";
import { fr } from "@/lib/i18n";
import { storeConfig } from "@/lib/store-config";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "./wordmark";
import { Botanical } from "./botanical";
export function Footer() {
  return <footer className="store-footer"><Botanical/><div className="container footer-grid">
    <div className="footer-brand"><Wordmark/><p>Des pièces choisies avec soin.<br/>Une élégance qui vous ressemble.</p></div>
    <div><h2>La boutique</h2><nav aria-label="Navigation de pied de page">{fr.navigation.slice(1, 4).map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
    <div><h2>Informations</h2><nav aria-label="Informations pratiques"><Link href="/informations#livraison">Livraison</Link><Link href="/informations#retours">Retours</Link><Link href="/informations#faq">Questions fréquentes</Link><Link href="/informations#commande">Conditions de commande</Link><Link href="/informations#confidentialite">Confidentialité</Link></nav></div>
    <div><h2>Restons proches</h2><p>Nos pièces, nos inspirations<br/>et les dernières collections.</p><a href={storeConfig.instagramUrl} className="social-link" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/> Instagram</a><Link href="/contact">Contacter Amoon</Link>{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Amoon. Tous droits réservés.</span><div><Link href="/informations#commande">Conditions de vente</Link><Link href="/informations#confidentialite">Politique de confidentialité</Link></div></div></footer>;
}
