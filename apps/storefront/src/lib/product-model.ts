import { type CatalogData, type CatalogProduct, type CatalogVariant, parseFilters, selectCatalog } from "./catalog-model";

export const stockLabel = (stock: CatalogVariant["stock"]) => ({ in_stock: "En stock", backorder: "Sur commande", out_of_stock: "Épuisé", unknown: "Disponibilité à confirmer" })[stock];
export function variantLabel(variant: CatalogVariant, translate: (value: string) => string = value => value) {
  return variant.options.map(option => translate(option.name) + " : " + translate(option.value)).join(" · ") || translate(variant.title || "Variante");
}
export function selectedVariant(product: CatalogProduct, id?: string) {
  if (id) return product.variants.find(variant => variant.id === id) || null;
  return product.variants.length === 1 ? product.variants[0] : null;
}
export function variantForOptions(product: CatalogProduct, choices: Record<string, string>) {
  return product.variants.find(variant => variant.options.length > 0 && variant.options.every(option => choices[option.name] === option.value) && Object.keys(choices).every(name => variant.options.some(option => option.name === name))) || null;
}
export function relatedProducts(data: CatalogData, product: CatalogProduct) {
  const products = data.products.filter(other => other.id !== product.id && ((product.collectionId && product.collectionId === other.collectionId) || other.categoryIds.some(id => product.categoryIds.includes(id))));
  return selectCatalog({ ...data, products }, parseFilters({}), undefined, 4).items;
}
