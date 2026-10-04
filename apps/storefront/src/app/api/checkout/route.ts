import { NextResponse } from "next/server";
import { checkoutCartId, checkoutService, checkoutImages, receiptCookie, RECEIPT_COOKIE } from "@/lib/checkout";
import { CheckoutError } from "@/lib/checkout-model";
import { CartError } from "@/lib/medusa-cart";
import { record } from "@/lib/catalog-model";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function failure(e: unknown) { return NextResponse.json({ error: e instanceof CheckoutError ? e.message : "La commande est indisponible. Actualisez-la avant de réessayer." }, { status: e instanceof CheckoutError || e instanceof CartError ? e.status : 503, headers }); }
export async function GET() { try { const id = await checkoutCartId(); return NextResponse.json({ checkout: id ? checkoutImages(await checkoutService().snapshot(id)) : null }, { headers }); } catch (e) { return failure(e); } }
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(process.env.STOREFRONT_URL || request.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
    const reader = request.body?.getReader(); if (!reader) throw new CheckoutError("Requête invalide.", 400);
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 8192) { await reader.cancel(); throw new CheckoutError("Requête trop volumineuse.", 413); } chunks.push(value); }
    let input: unknown; try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new CheckoutError("Requête invalide.", 400); }
    const data = record(input); const id = await checkoutCartId();
    if (!id) throw new CheckoutError("Votre panier est vide ou a expiré.", 400);
    const service = checkoutService();
    if (data.action === "address") return NextResponse.json({ checkout: checkoutImages(await service.address(id, data.customer)) }, { headers });
    if (data.action === "shipping") return NextResponse.json({ checkout: checkoutImages(await service.shipping(id, data.optionId)) }, { headers });
    if (data.action === "complete") {
      const order = await service.complete(id, data.review, data.consent);
      const response = NextResponse.json({ order }, { headers });
      response.cookies.set(RECEIPT_COOKIE, receiptCookie(order.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 86400 });
      return response;
    }
    throw new CheckoutError("Requête invalide.", 400);
  } catch (e) { return failure(e); }
}
