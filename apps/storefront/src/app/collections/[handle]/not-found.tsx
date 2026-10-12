import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
export default async function MissingCollection() {
  const t = await getTranslations(); return <section className="availability container"><p className="eyebrow">Amoon Collection</p><h1>{t("Collection introuvable")}</h1><p className="availability-description">{t("Cette collection n’est pas disponible. Découvrez les autres univers Amoon.")}</p><Link href="/collections" className={buttonClass()}>{t("Voir les collections")}</Link></section>; }
