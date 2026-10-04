import { mediaTarget } from "@/lib/catalog-media";
export async function GET(request: Request) {
  const target = mediaTarget(new URL(request.url).searchParams.get("url") || "", process.env.MEDUSA_INTERNAL_URL || "", process.env.PRODUCT_IMAGE_ORIGINS || "");
  if (!target) return new Response(null, { status: 400 });
  try {
    const response = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(8000), cache: "no-store" });
    const type = response.headers.get("content-type")?.split(";")[0].toLowerCase();
    if (!response.ok || !type || !["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(type)) return new Response(null, { status: 502 });
    const reader = response.body?.getReader(); if (!reader) return new Response(null, { status: 502 });
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 8 * 1024 * 1024) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    return new Response(Buffer.concat(chunks), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 502 }); }
}
