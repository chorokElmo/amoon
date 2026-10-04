"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { buttonClass } from "@/components/ui/button";
import { fold, catalogQuery, type CatalogGroup, type Filters } from "@/lib/catalog-model";

type Props = { action: string; filters: Filters; categories: CatalogGroup[]; sizes: string[]; colors: string[]; fixedCategory: boolean };
function FilterForm({ action, filters, categories, sizes, colors, fixedCategory }: Props) {
  const id = useId();
  function choices(title: string, name: string, values: { value: string; label: string }[], selected: string[]) {
    return <fieldset><legend>{title}</legend>{values.length ? <div className="filter-choices">{values.map(({ value, label }) => <label key={value}><input type="checkbox" name={name} value={value} defaultChecked={selected.some(item => fold(item) === fold(value) || fold(item) === fold(label))}/><span>{label}</span></label>)}</div> : <p className="filter-no-options">Aucune option pour le moment.</p>}</fieldset>;
  }
  return <form action={action} method="get" className="catalog-filter-form" key={JSON.stringify(filters)}>
    {filters.q && <input type="hidden" name="q" value={filters.q}/>}<input type="hidden" name="tri" value={filters.sort}/>
    {filters.universe && <input type="hidden" name="univers" value={filters.universe}/>}
    {!fixedCategory && choices("Catégories", "categorie", categories.map(group => ({ value: group.handle, label: group.name })), filters.categories)}
    {choices("Taille", "taille", sizes.map(value => ({ value, label: value })), filters.sizes)}
    {choices("Couleur", "couleur", colors.map(value => ({ value, label: value })), filters.colors)}
    <fieldset><legend>Prix en MAD</legend><div className="filter-price"><div><label htmlFor={id + "-min"}>Minimum</label><input id={id + "-min"} name="min" type="number" min="0" max="9999999" step="0.01" defaultValue={filters.min ?? ""} placeholder="0"/></div><div><label htmlFor={id + "-max"}>Maximum</label><input id={id + "-max"} name="max" type="number" min="0" max="9999999" step="0.01" defaultValue={filters.max ?? ""} placeholder="Sans limite"/></div></div></fieldset>
    <fieldset><legend>Disponibilité</legend><label className="filter-stock"><input name="disponible" type="checkbox" value="1" defaultChecked={filters.available}/> En stock uniquement</label></fieldset>
    {filters.issues.length > 0 && <p className="filter-validation" role="alert">{filters.issues.join(" ")}</p>}
    <button className={buttonClass()} type="submit">Appliquer les filtres</button><Link className="filter-reset" href={action + "?" + catalogQuery(filters, { categories: [], sizes: [], colors: [], available: false, min: null, max: null, page: 1 })}>Réinitialiser les filtres</Link>
  </form>;
}
export function CatalogFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const count = props.filters.categories.length + props.filters.sizes.length + props.filters.colors.length + Number(props.filters.available) + Number(props.filters.min !== null || props.filters.max !== null);
  return <><aside className="catalog-sidebar" aria-label="Filtres"><h2>Affiner la sélection</h2><FilterForm {...props}/></aside><div className="catalog-mobile-filter"><button type="button" className={buttonClass("outline")} onClick={() => setOpen(true)} aria-haspopup="dialog">Filtrer{count > 0 ? " (" + count + ")" : ""}</button></div><Sheet open={open} onClose={() => setOpen(false)} title="Filtrer les pièces"><FilterForm {...props}/></Sheet></>;
}
