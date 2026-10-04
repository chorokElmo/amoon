import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { SearchParams } from "@/lib/catalog-model";
export const metadata: Metadata = { title: "Boutique", alternates: { canonical: "/boutique" } };
export default async function Shop({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CatalogPage searchParams={await searchParams}/>;
}
