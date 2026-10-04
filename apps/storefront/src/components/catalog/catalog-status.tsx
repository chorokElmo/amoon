import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export function CatalogStatus({ title = "La boutique", action = "/boutique" }: { title?: string; action?: string }) {
  return <section className="catalog-unavailable container"><p className="eyebrow">Amoon Collection</p><h1>{title}</h1><h2>La sélection est momentanément indisponible.</h2><p>Nous ne pouvons pas afficher les pièces pour le moment. Réessayez dans quelques instants ou contactez-nous pour connaître les disponibilités.</p><div className="contact-actions"><a className={buttonClass("outline")} href={action}>Réessayer</a><Link className={buttonClass()} href="/contact">Nous contacter</Link></div></section>;
}
export function CatalogLoading() {
  return <section className="catalog-loading container" aria-busy="true" aria-label="Chargement du catalogue"><p role="status">Chargement des pièces…</p><div className="catalog-skeleton-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index}/>)}</div></section>;
}
