import Link from "next/link";
import { getTranslations } from "@/lib/i18n-server";
import { buttonClass } from "@/components/ui/button";
export default async function MissingPage() {
  const t = await getTranslations();
  return <section className="availability container"><h1>{t("Page introuvable")}</h1><p>{t("Cette page n’est pas disponible. Retrouvez nos pièces dans la boutique.")}</p><Link className={buttonClass()} href="/boutique">{t("Explorer la boutique")}</Link></section>;
}
