import { getTranslations } from "@/lib/i18n-server";
import { getStoreConfig } from "@/lib/store-config";
import styles from "./whatsapp-button.module.css";

export async function WhatsAppButton() {
  const t = await getTranslations();
  const storeConfig = await getStoreConfig();
  if (!storeConfig.whatsappUrl) return null;

  return (
    <a
      data-whatsapp-button
      className={styles.button}
      href={`${storeConfig.whatsappUrl}?text=${encodeURIComponent(t("Bonjour ") + storeConfig.settings.info.name + t(", j’aimerais avoir un renseignement."))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Contacter Amoon sur WhatsApp (nouvel onglet)")}
      title={t("Écrivez-nous sur WhatsApp")}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a12 12 0 0 0 5.8 1.5H12c6.6 0 12-5.3 12-11.9 0-3.2-1.2-6.2-3.5-8.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.3-.4a9.8 9.8 0 0 1-1.5-5.3C2.1 6.4 6.6 2 12.1 2a9.8 9.8 0 0 1 9.8 9.9c0 5.5-4.4 9.9-9.9 9.9Zm5.4-7.4c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.5Z" />
      </svg>
      <span className={styles.label}>{t("WhatsApp")}</span>
    </a>
  );
}
