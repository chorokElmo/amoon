import { localizeMetadata } from "@/lib/i18n-metadata";
import { getTranslations, getLanguage } from "@/lib/i18n-server";
import { catalogMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export async function generateMetadata({searchParams}: {searchParams: Promise<SearchParams>}): Promise<Metadata> {
  const t = await getTranslations(); return localizeMetadata(catalogMetadata(t("Boutique de mode féminine au Maroc"), t("Explorez les vêtements Amoon Collection. Trouvez votre pièce par taille, couleur et prix, avec livraison au Maroc."), "/boutique", await searchParams), await getLanguage()); }
export default async function Shop({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogPage searchParams={await searchParams}/>;
}
