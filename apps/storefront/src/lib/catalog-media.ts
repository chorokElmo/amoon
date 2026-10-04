export function mediaTarget(value: string, backend: string, allowedOrigins: string) {
  try {
    const api = new URL(backend); const target = new URL(value, api);
    if (target.username || target.password || !["http:", "https:"].includes(target.protocol)) return null;
    if (target.origin === api.origin && target.pathname.startsWith("/static/")) return target;
    const allowed = allowedOrigins.split(",").map(origin => origin.trim()).filter(Boolean);
    return target.protocol === "https:" && allowed.includes(target.origin) ? target : null;
  } catch { return null; }
}
