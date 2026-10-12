import { translate, type Language } from "./i18n";
// Canonical links, robots and structured URLs are preserved verbatim.
export function localizeMetadata<T>(metadata: T, language: Language): T {
  function visit(value: unknown, key = ""): unknown {
    if (value instanceof URL) return value;
    if (typeof value === "string") return ["title", "default", "description", "alt", "locale"].includes(key) ? translate(language, value) : value;
    if (Array.isArray(value)) return value.map(item => visit(item, key));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, visit(item, name)]));
    return value;
  }
  return visit(metadata) as T;
}
