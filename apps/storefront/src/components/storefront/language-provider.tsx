"use client";
import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, locales, translate, type Language } from "@/lib/i18n";

const LanguageContext = createContext<{ language: Language; change: (language: Language) => boolean }>({ language: "fr", change: () => false });
export function LanguageProvider({ language: initial, children }: { language: Language; children: ReactNode }) {
  const [language, setLanguage] = useState(initial);
  const router = useRouter();
  useEffect(() => { setLanguage(initial); }, [initial]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = locales[language].direction;
    // Native browser validation uses the browser's language, so supply storefront messages.
    const validate = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      const v = field.validity;
      const message = v.valueMissing ? "Veuillez remplir ce champ." : v.typeMismatch ? "Saisissez une adresse e-mail valide." : v.tooShort ? "Ce champ est trop court." : v.tooLong ? "Ce champ est trop long." : v.rangeUnderflow || v.rangeOverflow || v.stepMismatch ? "Choisissez une valeur dans la plage autorisée." : "Vérifiez la valeur de ce champ.";
      field.setCustomValidity(translate(language, message));
    };
    const clear = (event: Event) => {
      const field = event.target;
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.setCustomValidity("");
    };
    document.addEventListener("invalid", validate, true);
    document.addEventListener("input", clear, true);
    document.addEventListener("change", clear, true);
    return () => { document.removeEventListener("invalid", validate, true); document.removeEventListener("input", clear, true); document.removeEventListener("change", clear, true); };
  }, [language]);
  const change = useCallback((next: Language) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (!document.cookie.split(";").some(value => value.trim() === `${LOCALE_COOKIE}=${next}`)) return false;
    setLanguage(next);
    router.refresh();
    return true;
  }, [router]);
  return <LanguageContext.Provider value={{ language, change }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
export function useTranslations() {
  const { language } = useLanguage();
  return useCallback((message: string) => translate(language, message), [language]);
}
