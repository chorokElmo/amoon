import { createHmac, timingSafeEqual } from "node:crypto";
import { record, text } from "./catalog-model";
export type DeliveryAddress = { first_name: string; last_name: string; address_1: string; address_2: string; city: string; postal_code: string; phone: string; country_code: "ma" };
export type Customer = { email: string | null; address: DeliveryAddress };
export class CheckoutError extends Error { constructor(message: string, public status = 409) { super(message); } }
export function parseCustomer(input: unknown): Customer {
  const c = record(input); const a = record(c.address);
  function field(name: string, min: number, max: number) { const v = text(a[name]).trim(); if (v.length < min || v.length > max || /[\u0000-\u001f]/.test(v)) throw new CheckoutError("Vérifiez les informations de livraison.", 400); return v; }
  const email = text(c.email).trim().toLowerCase() || null;
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new CheckoutError("Saisissez une adresse e-mail valide.", 400);
  let first_name: string; let last_name: string;
  if (c.full_name !== undefined) {
    const fullName = text(c.full_name).trim().replace(/\s+/g, " ");
    if (/[\u0000-\u001f]/.test(text(c.full_name)) || fullName.length < 2 || fullName.length > 161) throw new CheckoutError("Saisissez votre nom complet.", 400);
    const parts = fullName.split(" "); first_name = parts.shift()!; last_name = parts.join(" ");
    if (first_name.length > 80 || last_name.length > 80) throw new CheckoutError("Votre nom est trop long.", 400);
  } else { first_name = field("first_name", 1, 80); last_name = field("last_name", 0, 80); }
  const phone = text(a.phone).replace(/[\s().-]/g, "").replace(/^00212/, "+212");
  if (!/^(?:0|\+212)[567]\d{8}$/.test(phone)) throw new CheckoutError("Saisissez un téléphone marocain valide (06…, 07…, 05… ou +212…).", 400);
  const postal_code = field("postal_code", 0, 5);
  if (postal_code && !/^\d{5}$/.test(postal_code)) throw new CheckoutError("Le code postal doit contenir 5 chiffres.", 400);
  if (a.country_code !== undefined && a.country_code !== "ma") throw new CheckoutError("La livraison est disponible uniquement au Maroc.", 400);
  return { email, address: { first_name, last_name, address_1: field("address_1", 5, 200), address_2: field("address_2", 0, 200), city: field("city", 2, 80), postal_code, phone: phone.startsWith("0") ? "+212" + phone.slice(1) : phone, country_code: "ma" } };
}
export function proof(value: unknown, secret: string, expires = Math.floor(Date.now() / 1000) + 600) {
  if (secret.length < 32) throw new CheckoutError("La commande est indisponible.", 503);
  return expires + "." + createHmac("sha256", secret).update(expires + ":" + JSON.stringify(value)).digest("hex");
}
export function validProof(token: unknown, value: unknown, secret: string, now = Date.now()) {
  if (typeof token !== "string" || !/^\d{10}\.[a-f0-9]{64}$/.test(token) || secret.length < 32) return false;
  const expires = Number(token.split(".")[0]);
  if (expires <= Math.floor(now / 1000) || expires > Math.floor(now / 1000) + 86400) return false;
  return timingSafeEqual(Buffer.from(token.split(".")[1], "hex"), Buffer.from(proof(value, secret, expires).split(".")[1], "hex"));
}
