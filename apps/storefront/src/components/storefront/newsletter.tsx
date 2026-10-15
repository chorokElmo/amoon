"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
export function NewsletterForm({ enabled = false }: { enabled?: boolean }) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!enabled) return; const data = new FormData(event.currentTarget); setBusy(true);
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "on" }) });
      if (!response.ok) throw new Error();
      setAccepted(true); setMessage("Votre demande d’inscription a été transmise.");
    } catch { setMessage("L’inscription est indisponible. Veuillez réessayer plus tard."); } finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <form onSubmit={submit}><label className="sr-only" htmlFor="newsletter-email">{t("Votre adresse e-mail")}</label><div className="newsletter-fields"><input id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder={t("Votre adresse e-mail")} disabled={!enabled || busy || accepted}/><button className={buttonClass()} disabled={!enabled || busy || accepted}>{busy ? t("Envoi…") : accepted ? t("Demande envoyée") : t("S’inscrire →")}</button></div>{enabled ? <label className="newsletter-consent"><input name="consent" type="checkbox" required disabled={busy || accepted}/> {t(" J’accepte de recevoir les nouvelles d’Amoon Collection. Je pourrai me désinscrire à tout moment.")}</label> : <p className="newsletter-unavailable">{t("Les inscriptions ouvriront bientôt. Retrouvez nos nouveautés sur Instagram.")}</p>}<p role="status" aria-live="polite">{t(message)}</p></form>;
}
