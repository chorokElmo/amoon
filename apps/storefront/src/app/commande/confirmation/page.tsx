import Link from "next/link";
import { currentReceipt } from "@/lib/checkout";
import { formatMad } from "@/lib/catalog-model";
import { buttonClass } from "@/components/ui/button";
export const metadata = { title: "Confirmation de commande", robots: { index: false, follow: false } };
export default async function Confirmation() {
  try {
    const order = await currentReceipt();
    if (!order) return <section className="container cart-page"><h1>Confirmation indisponible</h1><p>Retrouvez votre confirmation depuis la commande passée dans ce navigateur.</p><Link className={buttonClass()} href="/commande">Retrouver ma commande</Link></section>;
    return <section className="container cart-page"><p className="eyebrow">Amoon Collection</p><h1>Votre commande est enregistrée.</h1><p>Référence : <strong>{order.number}</strong></p><p>Paiement choisi : espèces à la livraison. Montant de la commande : <strong>{formatMad(order.total)}</strong>.</p><p>Conservez cette référence pour toute question concernant votre commande.</p><div className="checkout-confirmation-links"><Link className={buttonClass()} href="/boutique">Continuer mes achats</Link><Link className="text-link" href="/contact">Nous contacter</Link></div></section>;
  } catch { return <section className="container cart-page"><h1>Confirmation momentanément indisponible</h1><p>Votre commande peut déjà être enregistrée. Retrouvez sa confirmation avant de recommander.</p><Link className={buttonClass()} href="/commande">Vérifier ma commande</Link></section>; }
}
