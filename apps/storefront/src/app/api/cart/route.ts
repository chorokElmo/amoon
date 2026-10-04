import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cartService, cartImages, currentCart } from "@/lib/cart";
import { CART_COOKIE, CART_AGE, readCartCookie, signCart } from "@/lib/cart-cookie";
import { CartError, parseCartAction } from "@/lib/medusa-cart";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function failure(error: unknown) {
  const code = error instanceof CartError ? error.code : "unavailable";
  const message = code === "invalid" ? "Quantité ou article invalide." : code === "product" || code === "missing" ? "Cet article n’est plus disponible à ce prix ou cette quantité. Actualisez le panier." : "Le panier est indisponible. Actualisez-le avant de réessayer.";
  return NextResponse.json({ error: message }, { status: error instanceof CartError ? error.status : 503, headers });
}
export async function GET() { try { return NextResponse.json({ cart: await currentCart() }, { headers }); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  let signed: string | null = null;
  try {
    const origin = new URL(process.env.STOREFRONT_URL || request.url).origin;
    if (request.headers.get("origin") !== origin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415, headers });
    const reader = request.body?.getReader(); if (!reader) throw new CartError("invalid", 400);
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 4096) { await reader.cancel(); throw new CartError("invalid", 413); } chunks.push(value); }
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new CartError("invalid", 400); }
    const action = parseCartAction(input);
    const service = cartService(); const secret = process.env.CART_COOKIE_SECRET || "";
    const id = readCartCookie((await cookies()).get(CART_COOKIE)?.value, secret);
    let cart = null;
    if (id) { try { cart = await service.get(id); } catch (error) { if (!(error instanceof CartError) || error.code !== "missing") throw error; } }
    if (!cart) {
      if (action.action !== "add") throw new CartError("invalid", 400);
      await service.eligible(action.productId, action.variantId);
      cart = await service.create(); signed = signCart(cart.id, secret);
    }
    const updated = cartImages(await service.mutate(cart, action));
    const response = NextResponse.json({ cart: updated }, { headers });
    if (signed) response.cookies.set(CART_COOKIE, signed, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: CART_AGE });
    return response;
  } catch (error) {
    const response = failure(error);
    if (signed) response.cookies.set(CART_COOKIE, signed, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: CART_AGE });
    return response;
  }
}
