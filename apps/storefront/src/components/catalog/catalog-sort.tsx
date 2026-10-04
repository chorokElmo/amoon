"use client";
import { useId } from "react";
import { catalogQuery, sortChoices, type Filters } from "@/lib/catalog-model";
export function CatalogSort({ action, filters }: { action: string; filters: Filters }) {
  const id = useId();
  return <form action={action} method="get" className="catalog-sort"><label htmlFor={id}>Trier par</label>{Array.from(new URLSearchParams(catalogQuery(filters, { page: 1 })).entries()).filter(([key]) => key !== "tri").map(([key, value], index) => <input type="hidden" name={key} value={value} key={key + index}/>)}<select id={id} name="tri" defaultValue={filters.sort} onChange={event => event.currentTarget.form?.requestSubmit()}>{Object.entries(sortChoices).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><noscript><button type="submit">Trier</button></noscript></form>;
}
