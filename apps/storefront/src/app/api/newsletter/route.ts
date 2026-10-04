import { newsletterEndpoint } from "@/lib/newsletter-config";
export async function POST(request: Request) {
  let origin: string;
  try { origin = new URL(process.env.STOREFRONT_URL || request.url).origin; } catch { return Response.json({ error: "Unavailable" }, { status: 503 }); }
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Invalid request" }, { status: 400 });
  let bytes = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 2048) { await reader.cancel(); return Response.json({ error: "Too large" }, { status: 413 }); } chunks.push(value); }
  let data: { email?: unknown; consent?: unknown };
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (!data || typeof data.email !== "string" || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.consent !== true) return Response.json({ error: "Email and consent required" }, { status: 400 });
  const endpoint = newsletterEndpoint();
  if (!endpoint) return Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    const response = await fetch(endpoint, { method: "POST", redirect: "error", headers: { "Content-Type": "application/json", ...(process.env.NEWSLETTER_API_TOKEN ? { Authorization: `Bearer ${process.env.NEWSLETTER_API_TOKEN}` } : {}) }, body: JSON.stringify({ email: data.email.trim().toLowerCase(), consent: true, consent_at: new Date().toISOString(), source: "amoon-homepage" }), signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok || (await response.json()).accepted !== true) throw new Error();
    return Response.json({ accepted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unavailable" }, { status: 503 }); }
}
