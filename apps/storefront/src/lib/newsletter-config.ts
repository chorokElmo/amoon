import "server-only";
export function newsletterEndpoint() {
  try { const url = new URL(process.env.NEWSLETTER_SUBSCRIBE_URL || ""); return url.protocol === "https:" && !url.username && !url.password ? url : null; } catch { return null; }
}
