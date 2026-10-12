import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { LOCALE_COOKIE, parseLanguage, translate } from "./i18n";
export const getLanguage = cache(async () => parseLanguage((await cookies()).get(LOCALE_COOKIE)?.value));
export async function getTranslations() {
  const language = await getLanguage();
  return (message: string) => translate(language, message);
}
