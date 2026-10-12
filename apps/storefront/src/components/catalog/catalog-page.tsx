import { getTranslations } from "@/lib/i18n-server";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { parseFilters, selectCatalog, catalogQuery, type SearchParams, type CatalogData, type CatalogGroup } from "@/lib/catalog-model";
import { CatalogFilters } from "./catalog-filters";
import { CatalogSort } from "./catalog-sort";
import { CatalogCard } from "./catalog-card";
import { CatalogStatus } from "./catalog-status";
import { buttonClass } from "@/components/ui/button";

export async function CatalogPage({ searchParams, action = "/boutique", title = "La boutique", subtitle = "Des pièces à porter à votre façon.", data: suppliedData, scope }: { searchParams: SearchParams; action?: string; title?: string; subtitle?: string; data?: CatalogData; scope?: { kind: "category" | "collection"; group: CatalogGroup } }) {
  const t = await getTranslations();
  const result = suppliedData ? { ok: true as const, data: suppliedData } : await getCatalog();
  if (!result.ok) return <CatalogStatus title={title} action={action + (searchParams.univers === "collection" ? "?univers=collection" : "")}/>;
  const filters = parseFilters(searchParams);
  const resetHref = action + (filters.universe ? "?univers=collection" : "");
  const selection = selectCatalog(result.data, filters, scope ? { kind: scope.kind, id: scope.group.id } : undefined);
  const chips = [...filters.categories.map(value => ({ label: result.data.categories.find(group => [group.id, group.handle, group.name].includes(value))?.name || value, query: catalogQuery(filters, { categories: filters.categories.filter(item => item !== value), page: 1 }) })), ...filters.sizes.map(value => ({ label: t("Taille ") + value, query: catalogQuery(filters, { sizes: filters.sizes.filter(item => item !== value), page: 1 }) })), ...filters.colors.map(value => ({ label: value, query: catalogQuery(filters, { colors: filters.colors.filter(item => item !== value), page: 1 }) }))];
  if (filters.min !== null || filters.max !== null) chips.push({ label: (filters.min ?? 0) + " – " + (filters.max ?? "∞") + " MAD", query: catalogQuery(filters, { min: null, max: null, page: 1 }) });
  if (filters.available) chips.push({ label: t("En stock"), query: catalogQuery(filters, { available: false, page: 1 }) });
  return <div className="catalog-page container"><nav className="catalog-breadcrumb" aria-label={t("Fil d’Ariane")}><Link href="/">{t("Accueil")}</Link><span aria-hidden="true">/</span>{scope ? <><Link href="/collections">{t("Collections")}</Link><span aria-hidden="true">/</span></> : null}<span aria-current="page">{t(title)}</span></nav><header className="catalog-page-heading"><p className="eyebrow">{t("La sélection Amoon")}</p><h1>{t(title)}</h1><p>{t(subtitle)}</p></header>
    <form action={action} method="get" className="catalog-search">{Array.from(new URLSearchParams(catalogQuery(filters, { page: 1 })).entries()).filter(([key]) => key !== "q").map(([key, value], index) => <input type="hidden" name={key} value={value} key={key + index}/>)}<label htmlFor="catalog-search">{t("Rechercher une pièce")}</label><div><input id="catalog-search" name="q" type="search" maxLength={100} defaultValue={filters.q} placeholder={t("Robe, abaya, ensemble…")}/><button className={buttonClass("outline")} type="submit">{t("Rechercher")}</button></div></form>
    <div className="catalog-layout"><CatalogFilters action={action} filters={filters} categories={result.data.categories} sizes={selection.sizes} colors={selection.colors} fixedCategory={scope?.kind === "category"}/><div className="catalog-results"><div className="catalog-toolbar"><p role="status">{selection.total} {selection.total === 1 ? t("pièce") : t("pièces")}{filters.q && <> {t(" pour « ")}{filters.q} »</>}</p><CatalogSort action={action} filters={filters}/></div>
      {chips.length > 0 && <nav className="filter-chips" aria-label={t("Filtres actifs")}>{chips.map((chip, index) => <Link key={index} href={action + (chip.query ? "?" + chip.query : "")} aria-label={t("Retirer le filtre ") + chip.label}>{t(chip.label)}<span aria-hidden="true">×</span></Link>)}</nav>}
      {filters.issues.length > 0 && <p className="filter-validation" role="alert">{filters.issues.map(t).join(" ")}</p>}
      {filters.sort === "popular" && !selection.hasPopularity && <p className="catalog-hint">{t("La sélection populaire sera bientôt disponible. Les pièces sont présentées par nouveauté.")}</p>}
      {filters.sort === "popular" && selection.hasPopularity && <p className="catalog-hint">{t("La sélection mise en avant par Amoon Collection.")}</p>}
      {selection.total > 0 ? <div className="catalog-product-grid">{selection.items.map(item => <CatalogCard key={item.product.id} item={item}/>)}</div> : <section className="catalog-empty"><h2>{result.data.products.length === 0 ? t("La collection se prépare.") : t("Aucune pièce ne correspond à votre recherche.")}</h2><p>{result.data.products.length === 0 ? t("Nos pièces seront présentées ici dès leur mise en ligne.") : t("Essayez d’autres mots ou élargissez vos filtres.")}</p><Link className={buttonClass("outline")} href={resetHref}>{t("Voir toute la sélection")}</Link></section>}
      {selection.pages > 1 && <nav className="catalog-pagination" aria-label={t("Pagination")}>{selection.page > 1 && <Link href={action + "?" + catalogQuery(filters, { page: selection.page - 1 })} rel="prev">{t("Précédent")}</Link>}<span aria-current="page">{t("Page ")}{selection.page} {t(" sur ")}{selection.pages}</span>{selection.page < selection.pages && <Link href={action + "?" + catalogQuery(filters, { page: selection.page + 1 })} rel="next">{t("Suivant")}</Link>}</nav>}
      <p className="catalog-inventory-note">{t("Disponibilités indicatives, actualisées régulièrement. Contactez-nous pour confirmer une pièce.")}</p>
    </div></div>
  </div>;
}
