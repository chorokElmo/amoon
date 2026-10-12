"use client";
import { useState } from "react";
import { useLanguage, useTranslations } from "./language-provider";
export function LanguageSwitcher() {
  const { language, change } = useLanguage();
  const t = useTranslations();
  const [error, setError] = useState(false);
  return <div className="language-switcher-wrap"><div className="language-switcher" role="group" aria-label={t("Langue")} dir="ltr"><button type="button" lang="fr" aria-pressed={language === "fr"} onClick={() => setError(!change("fr"))}>FR</button><span aria-hidden="true">|</span><button type="button" lang="ar" aria-pressed={language === "ar"} onClick={() => setError(!change("ar"))}>العربية</button></div>{error && <p role="alert">{t("Impossible de changer la langue. Autorisez les cookies puis réessayez.")}</p>}</div>;
}
