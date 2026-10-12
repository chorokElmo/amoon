import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export async function Availability({ title, description, eyebrow = "Amoon Collection" }: { title: string; description: string; eyebrow?: string }) {
  const t = await getTranslations();
  return <section className="availability container"><p className="eyebrow">{eyebrow}</p><h1>{t(title)}</h1><p className="availability-description">{t(description)}</p><Link href="/contact" className={buttonClass("outline")}>{t("Nous contacter")}</Link></section>;
}
