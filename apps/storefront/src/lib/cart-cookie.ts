import { createHmac, timingSafeEqual } from "node:crypto";
export const CART_COOKIE = "amoon_cart";
export const CART_AGE = 30 * 24 * 60 * 60;
export function signCart(id: string, secret: string, now = Date.now()) {
  if (secret.length < 32 || !/^cart_[a-zA-Z0-9]+$/.test(id)) throw new Error("Invalid cart configuration");
  const payload = id + "." + (Math.floor(now / 1000) + CART_AGE);
  return payload + "." + createHmac("sha256", secret).update(payload).digest("hex");
}
export function readCartCookie(value: string | undefined, secret: string, now = Date.now()): string | null {
  if (!value || value.length > 200 || secret.length < 32) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || !/^cart_[a-zA-Z0-9]+$/.test(parts[0]) || !/^\d+$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return null;
  const expiry = Number(parts[1]);
  if (expiry <= Math.floor(now / 1000) || expiry > Math.floor(now / 1000) + CART_AGE) return null;
  const signature = createHmac("sha256", secret).update(parts[0] + "." + parts[1]).digest();
  return timingSafeEqual(signature, Buffer.from(parts[2], "hex")) ? parts[0] : null;
}
