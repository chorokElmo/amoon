"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import { useId, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { buttonClass } from "@/components/ui/button";
import { fold, catalogQuery, categoryTree, type CategoryNode, type CatalogGroup, type Filters } from "@/lib/catalog-model";

type Props = { action: string; filters: Filters; categories: CatalogGroup[]; sizes: string[]; colors: string[]; fixedCategory: boolean };
function branchSelected(node: CategoryNode, selected: Set<string>): boolean {
  return node.aliasIds.some(id => selected.has(id)) || node.children.some(child => branchSelected(child, selected));
}
function CategoryChoice({ node, selected }: { node: CategoryNode; selected: Set<string> }) {
  const t = useTranslations();
  const id = useId();
  const [expanded, setExpanded] = useState(() => branchSelected(node, selected));
  return <li><div className="filter-category-row"><label><input type="checkbox" name="categorie" value={node.handle} defaultChecked={node.aliasIds.some(id => selected.has(id))}/><span>{t(node.name)}</span></label>{node.children.length > 0 && <button className="filter-category-toggle" type="button" aria-label={t("Sous-catégories de ") + t(node.name)} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}><span aria-hidden="true">{expanded ? "−" : "+"}</span></button>}</div>{node.children.length > 0 && <ul id={id} hidden={!expanded}>{node.children.map(child => <CategoryChoice key={child.id} node={child} selected={selected}/>)}</ul>}</li>;
}
function FilterForm({ action, filters, categories, sizes, colors, fixedCategory }: Props) {
  const t = useTranslations();
  const id = useId();
  const tree = categoryTree(categories);
  const selectedCategories = new Set(filters.categories.flatMap(value => {
    const group = categories.find(group => [group.id, group.handle, group.name].some(alias => fold(alias) === fold(value)));
    return group ? [group.id] : [];
  }));
  function choices(title: string, name: string, values: { value: string; label: string }[], selected: string[]) {
    return <fieldset><legend>{title}</legend>{values.length ? <div className="filter-choices">{values.map(({ value, label }) => <label key={value}><input type="checkbox" name={name} value={value} defaultChecked={selected.some(item => fold(item) === fold(value) || fold(item) === fold(label))}/><span>{t(label)}</span></label>)}</div> : <p className="filter-no-options">{t("Aucune option pour le moment.")}</p>}</fieldset>;
  }
  return <form action={action} method="get" className="catalog-filter-form" key={JSON.stringify(filters)}>
    {filters.q && <input type="hidden" name="q" value={filters.q}/>}<input type="hidden" name="tri" value={filters.sort}/>
    {filters.universe && <input type="hidden" name="univers" value={filters.universe}/>}
    {!fixedCategory && <fieldset><legend>{t("Catégories")}</legend>{tree.length ? <ul className="filter-choices filter-category-tree">{tree.map(node => <CategoryChoice key={node.id} node={node} selected={selectedCategories}/>)}</ul> : <p className="filter-no-options">{t("Aucune option pour le moment.")}</p>}</fieldset>}
    {sizes.length > 0 && choices(t("Taille"), "taille", sizes.map(value => ({ value, label: value })), filters.sizes)}
    {colors.length > 0 && choices(t("Couleur"), "couleur", colors.map(value => ({ value, label: value })), filters.colors)}
    <fieldset><legend>{t("Prix en MAD")}</legend><div className="filter-price"><div><label htmlFor={id + "-min"}>{t("Minimum")}</label><input id={id + "-min"} name="min" type="number" min="0" max="9999999" step="0.01" defaultValue={filters.min ?? ""} placeholder="0"/></div><div><label htmlFor={id + "-max"}>{t("Maximum")}</label><input id={id + "-max"} name="max" type="number" min="0" max="9999999" step="0.01" defaultValue={filters.max ?? ""} placeholder={t("Sans limite")}/></div></div></fieldset>
    <fieldset><legend>{t("Disponibilité")}</legend><label className="filter-stock"><input name="disponible" type="checkbox" value="1" defaultChecked={filters.available}/> {t(" En stock uniquement")}</label></fieldset>
    {filters.issues.length > 0 && <p className="filter-validation" role="alert">{filters.issues.map(t).join(" ")}</p>}
    <button className={buttonClass()} type="submit">{t("Appliquer les filtres")}</button><Link className="filter-reset" href={action + "?" + catalogQuery(filters, { categories: [], sizes: [], colors: [], available: false, min: null, max: null, page: 1 })}>{t("Réinitialiser les filtres")}</Link>
  </form>;
}
export function CatalogFilters(props: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const count = props.filters.categories.length + props.filters.sizes.length + props.filters.colors.length + Number(props.filters.available) + Number(props.filters.min !== null || props.filters.max !== null);
  return <><aside className="catalog-sidebar" aria-label={t("Filtres")}><h2>{t("Affiner la sélection")}</h2><FilterForm {...props}/></aside><div className="catalog-mobile-filter"><button type="button" className={buttonClass("outline")} onClick={() => setOpen(true)} aria-haspopup="dialog">{t("Filtrer")}{count > 0 ? " (" + count + ")" : ""}</button></div><Sheet open={open} onClose={() => setOpen(false)} title={t("Filtrer les pièces")}><FilterForm {...props}/></Sheet></>;
}
