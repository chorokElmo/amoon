import { catalogMetadata } from "@/lib/seo";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export async function generateMetadata({searchParams}: {searchParams: Promise<SearchParams>}) { return catalogMetadata("Nouveautés mode féminine", "Découvrez les dernières pièces Amoon Collection : des vêtements féminins faciles à porter au quotidien. Livraison au Maroc.", "/nouveautes", await searchParams); }
export default async function NewArrivals({ searchParams }: { searchParams: Promise<SearchParams> }) { return <CatalogPage searchParams={await searchParams} action="/nouveautes" title="Les nouveautés" subtitle="Un nouveau regard sur les essentiels du quotidien."/>; }
