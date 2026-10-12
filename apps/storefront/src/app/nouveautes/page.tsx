import { localizeMetadata } from "@/lib/i18n-metadata";
import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { catalogMetadata } from "@/lib/seo";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export async function generateMetadata({searchParams}: {searchParams: Promise<SearchParams>}) {
  const t = await getTranslations(); return localizeMetadata(catalogMetadata(t("Nouveautés mode féminine"), t("Découvrez les dernières pièces Amoon Collection : des vêtements féminins faciles à porter au quotidien. Livraison au Maroc."), "/nouveautes", await searchParams), await getLanguage()); }
export default async function NewArrivals({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getTranslations(); return <CatalogPage searchParams={await searchParams} action="/nouveautes" title={t("Les nouveautés")} subtitle={t("Un nouveau regard sur les essentiels du quotidien.")}/>; }
