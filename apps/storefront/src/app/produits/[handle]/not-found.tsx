import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export default function ProductNotFound() { return <section className="catalog-unavailable container"><p className="eyebrow">Amoon Collection</p><h1>Cette pièce est introuvable.</h1><p>Elle n’est plus disponible dans notre catalogue.</p><Link className={buttonClass()} href="/boutique">Découvrir la boutique</Link></section>; }
