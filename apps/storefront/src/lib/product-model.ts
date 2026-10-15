import { type CatalogData, type CatalogProduct, type CatalogVariant, fold, parseFilters, selectCatalog } from "./catalog-model";

export function optionKind(name: string): "color" | "size" | "other" {
  const key = fold(name);
  if (["couleur", "couleurs", "color", "colors", "colour", "colours", "اللون", "لون"].includes(key)) return "color";
  if (["taille", "tailles", "size", "sizes", "المقاس", "مقاس"].includes(key)) return "size";
  return "other";
}

export function orderedOptionValues(product: CatalogProduct, name: string) {
  const values = [...new Set(product.variants.flatMap(variant => variant.options.filter(option => option.name === name).map(option => option.value)))];
  if (optionKind(name) !== "size") return values;
  const order = ["xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl"];
  const rank = (value: string) => order.includes(fold(value)) ? order.indexOf(fold(value)) : order.length;
  return values.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "fr", { numeric: true }));
}

export function optionAvailability(product: CatalogProduct, choices: Record<string, string>, name: string, value: string) {
  const candidates = product.variants.filter(variant => variant.options.some(option => option.name === name && option.value === value) && Object.entries(choices).every(([other, selected]) => other === name || variant.options.some(option => option.name === other && option.value === selected)));
  if (!candidates.length) return "Combinaison indisponible";
  const priced = candidates.filter(variant => variant.price !== null && variant.price > 0);
  if (!priced.length) return "Prix indisponible";
  if (priced.some(variant => variant.stock === "in_stock")) return "En stock";
  if (priced.some(variant => variant.stock === "backorder")) return "Sur commande";
  if (priced.some(variant => variant.stock === "unknown")) return "À confirmer";
  return "Épuisé";
}

export function optionColor(name: string, value: string): string | null {
  if (optionKind(name) !== "color") return null;
  if (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value.trim())) return value.trim();
  const colors: Record<string, string> = { noir: "#24201f", black: "#24201f", "أسود": "#24201f", blanc: "#fffaf3", white: "#fffaf3", "أبيض": "#fffaf3", beige: "#cdb7a2", "بيج": "#cdb7a2", bordeaux: "#650f2c", burgundy: "#650f2c", "عنابي": "#650f2c", rose: "#c596a4", pink: "#c596a4", "وردي": "#c596a4", marron: "#76513f", brown: "#76513f", "بني": "#76513f", bleu: "#315a85", blue: "#315a85", "أزرق": "#315a85", vert: "#49664b", green: "#49664b", "أخضر": "#49664b" };
  const additional: Record<string, string> = { terracotta: "#ae5f43", sauge: "#97a58b", marine: "#28344e", "bleu ciel": "#acc9e2", ecru: "#f0e8d8", "rose poudre": "#d5a6a8", camel: "#b58a5e", sable: "#d2c1a5", olive: "#707650", champagne: "#e6d6b7", anthracite: "#45464b", taupe: "#9a887c" };
  return colors[fold(value)] || additional[fold(value)] || null;
}

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
