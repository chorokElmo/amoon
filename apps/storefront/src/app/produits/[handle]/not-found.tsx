import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export default async function ProductNotFound() {
  const t = await getTranslations(); return <section className="catalog-unavailable container"><p className="eyebrow">Amoon Collection</p><h1>{t("Cette pièce est introuvable.")}</h1><p>{t("Elle n’est plus disponible dans notre catalogue.")}</p><Link className={buttonClass()} href="/boutique">{t("Découvrir la boutique")}</Link></section>; }
