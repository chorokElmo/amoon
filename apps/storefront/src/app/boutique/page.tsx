import { catalogMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export async function generateMetadata({searchParams}: {searchParams: Promise<SearchParams>}): Promise<Metadata> { return catalogMetadata("Boutique de mode féminine au Maroc", "Explorez les vêtements Amoon Collection. Trouvez votre pièce par taille, couleur et prix, avec livraison au Maroc.", "/boutique", await searchParams); }
export default async function Shop({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogPage searchParams={await searchParams}/>;
}
