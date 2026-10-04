import { storeConfig } from "@/lib/store-config";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
export const metadata = { title: "Contact", alternates: { canonical: "/contact" } };
export default function Contact() {
  return <section className="contact-page container"><p className="eyebrow">À votre écoute</p><h1>Parlons de votre<br/><em>prochaine pièce.</em></h1><p>Une question sur une taille, une couleur ou une disponibilité ?<br/>Écrivez-nous, nous vous accompagnerons dans votre choix.</p><div className="contact-actions"><a href={storeConfig.instagramUrl} className={buttonClass()} target="_blank" rel="noopener noreferrer"><Icon name="instagram"/>Nous écrire sur Instagram</a>{storeConfig.whatsappUrl && <a href={storeConfig.whatsappUrl} className={buttonClass("outline")} target="_blank" rel="noopener noreferrer">Nous écrire sur WhatsApp<Icon name="arrow"/></a>}</div></section>;
}
