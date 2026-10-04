import Link from "next/link";
import { fr } from "@/lib/i18n";
import { storeConfig } from "@/lib/store-config";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "./wordmark";
export function Footer() {
  return <footer className="store-footer"><div className="container footer-grid">
    <div className="footer-brand"><Wordmark/><p>Des pièces choisies avec soin.<br/>Une élégance qui vous ressemble.</p></div>
    <div><h2>La boutique</h2><nav aria-label="Navigation de pied de page">{fr.navigation.slice(1, 4).map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
    <div><h2>À votre écoute</h2><Link href="/contact">Nous contacter</Link>{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>}<p className="footer-note">Livraison partout au Maroc.</p></div>
    <div><h2>Le journal Amoon</h2><p>Nos pièces, nos inspirations<br/>et les dernières collections.</p><a href={storeConfig.instagramUrl} className="social-link" target="_blank" rel="noopener noreferrer"><Icon name="instagram"/> @amoon.collection1</a></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Amoon Collection</span><span>Maroc · Français · MAD</span></div></footer>;
}
