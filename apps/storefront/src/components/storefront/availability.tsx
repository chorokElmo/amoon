import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export function Availability({ title, description, eyebrow = "Amoon Collection" }: { title: string; description: string; eyebrow?: string }) {
  return <section className="availability container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="availability-description">{description}</p><Link href="/contact" className={buttonClass("outline")}>Nous contacter</Link></section>;
}
