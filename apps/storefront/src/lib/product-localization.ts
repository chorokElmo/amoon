import type { CatalogData, CatalogProduct, ProductTranslation } from "./catalog-model";
export function productArabicTranslation(metadata: unknown): ProductTranslation | undefined {
  if (!metadata || typeof metadata !== "object") return;
  const translations = (metadata as { translations?: unknown }).translations;
  if (!translations || typeof translations !== "object") return;
  const ar = (translations as { ar?: unknown }).ar;
  if (!ar || typeof ar !== "object") return;
  const input = ar as Record<string, unknown>;
  const field = (name: string, max = 10000) => typeof input[name] === "string" && input[name].trim() ? input[name].trim().slice(0, max) : undefined;
  const variants = input.variants && typeof input.variants === "object" ? Object.fromEntries(Object.entries(input.variants).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim())).map(([id, title]) => [id, title.trim().slice(0, 300)])) : undefined;
  return { title: field("title", 300), description: field("description"), composition: field("composition"), size_guide: field("size_guide"), variants };
}
export function localizeProduct(product: CatalogProduct, language: "fr" | "ar"): CatalogProduct {
  const ar = language === "ar" ? product.translations?.ar : undefined;
  if (!ar) return product;
  return { ...product, title: ar.title || product.title, description: ar.description || product.description, composition: ar.composition || product.composition, sizeGuide: ar.size_guide || product.sizeGuide,
    searchText: [product.title, product.description, ar.title, ar.description].filter(Boolean).join(" "),
    variants: product.variants.map(variant => ({ ...variant, title: ar.variants?.[variant.id] || variant.title })) };
}
export function localizeCatalog(data: CatalogData, language: "fr" | "ar"): CatalogData {
  return language === "fr" ? data : { ...data, products: data.products.map(product => localizeProduct(product, language)) };
}
