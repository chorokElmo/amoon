"use client";
import Link from "next/link";
import { useTranslations } from "@/components/storefront/language-provider";
import { buttonClass } from "@/components/ui/button";
export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();
  return <section className="availability container" role="alert"><h1>{t("La page est momentanément indisponible.")}</h1><p>{t("Réessayez dans quelques instants ou contactez la boutique.")}</p><div className="contact-actions"><button className={buttonClass()} onClick={reset}>{t("Réessayer")}</button><Link className={buttonClass("outline")} href="/contact">{t("Nous contacter")}</Link></div></section>;
}
