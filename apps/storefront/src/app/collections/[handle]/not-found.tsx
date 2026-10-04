import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export default function MissingCollection() { return <section className="availability container"><p className="eyebrow">Amoon Collection</p><h1>Collection introuvable</h1><p className="availability-description">Cette collection n’est pas disponible. Découvrez les autres univers Amoon.</p><Link href="/collections" className={buttonClass()}>Voir les collections</Link></section>; }
