import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export const metadata = { title: "Nouveautés", alternates: { canonical: "/nouveautes" } };
export default async function NewArrivals({ searchParams }: { searchParams: Promise<SearchParams> }) { return <CatalogPage searchParams={await searchParams} action="/nouveautes" title="Les nouveautés" subtitle="Un nouveau regard sur les essentiels du quotidien."/>; }
