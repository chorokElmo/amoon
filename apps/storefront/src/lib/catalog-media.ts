export function mediaTarget(value: string, backend: string, allowedOrigins: string, legacyOrigins = "") {
  try {
    const api = new URL(backend); const target = new URL(value, api);
    if (target.username || target.password || !["http:", "https:"].includes(target.protocol)) return null;
    if (target.origin === api.origin && target.pathname.startsWith("/static/")) return target;
    const legacy = legacyOrigins.split(",").map(origin => origin.trim()).filter(Boolean);
    if (legacy.includes(target.origin) && target.pathname.startsWith("/static/")) return new URL(target.pathname + target.search, api.origin);
    const allowed = allowedOrigins.split(",").map(origin => origin.trim()).filter(Boolean);
    return target.protocol === "https:" && allowed.includes(target.origin) ? target : null;
  } catch { return null; }
}

export function catalogImagePath(src: string | null, backend: string, allowedOrigins: string, legacyOrigins = ""): string | null {
  if (!src || src.startsWith("/images/demo/")) return null;
  if (src.startsWith("/images/") && !src.includes("..") && !src.includes("\\")) return src;
  let value = src;
  if (src.startsWith("/api/catalog-image?")) {
    try {
      const proxy = new URL(src, "https://image.invalid");
      if (proxy.pathname !== "/api/catalog-image" || proxy.hash || proxy.searchParams.getAll("url").length !== 1 || [...proxy.searchParams.keys()].some(key => key !== "url")) return null;
      value = proxy.searchParams.get("url") || "";
    } catch { return null; }
  }
  const target = mediaTarget(value, backend, allowedOrigins, legacyOrigins);
  return target ? "/api/catalog-image?url=" + encodeURIComponent(target.toString()) : null;
}
