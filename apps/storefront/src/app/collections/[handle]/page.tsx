import { catalogMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { groupByHandle, type SearchParams } from "@/lib/catalog-model";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { CatalogStatus } from "@/components/catalog/catalog-status";
type Props = { params: Promise<{ handle: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ handle }, query, result] = await Promise.all([params, searchParams, getCatalog()]);
  const scope = result.ok ? query.univers === "collection" ? result.data.collections.find(group => group.handle === handle) : groupByHandle(result.data, handle)?.group : null;
  const collision = query.univers === "collection" && result.ok && result.data.categories.some(group => group.handle === handle);
  return scope ? catalogMetadata(scope.name, scope.description || `Découvrez ${scope.name} chez Amoon Collection : une sélection de mode féminine au Maroc.`, "/collections/" + encodeURIComponent(handle) + (collision ? "?univers=collection" : ""), query) : {title:"Collection indisponible",robots:{index:false,follow:false}};
}
export default async function Collection({ params, searchParams }: Props) {
  const [{ handle }, query, result] = await Promise.all([params, searchParams, getCatalog()]);
  const action = "/collections/" + encodeURIComponent(handle);
  if (!result.ok) return <CatalogStatus title="La collection" action={action + (query.univers === "collection" ? "?univers=collection" : "")}/>;
  const group = query.univers === "collection" ? result.data.collections.find(group => group.handle === handle) : null;
  const scope = query.univers === "collection" ? group ? { kind: "collection" as const, group } : null : groupByHandle(result.data, handle);
  if (!scope) notFound();
  return <CatalogPage action={action} title={scope.group.name} subtitle={scope.group.description || "Découvrez la sélection Amoon, à votre façon."} searchParams={query} data={result.data} scope={scope}/>;
}
