"use client";
import { useSyncExternalStore } from "react";
const key = "amoon:favorites";
function read() { try { return localStorage.getItem(key) || "[]"; } catch { return "[]"; } }
function subscribe(callback: () => void) { window.addEventListener("amoon:favorites", callback); window.addEventListener("storage", callback); return () => { window.removeEventListener("amoon:favorites", callback); window.removeEventListener("storage", callback); }; }
function decode(value: string): string[] { try { const values: unknown = JSON.parse(value); return Array.isArray(values) ? [...new Set(values.filter((v): v is string => typeof v === "string" && /^prod_[a-zA-Z0-9]+$/.test(v)))].slice(0,200) : []; } catch { return []; } }
export function useWishlist() {
  const snapshot = useSyncExternalStore(subscribe, read, () => "[]");
  return { ids: decode(snapshot), toggle(id: string) { const current = decode(read()); const updated = current.includes(id) ? current.filter(value => value !== id) : [...current, id].slice(-200); try { localStorage.setItem(key,JSON.stringify(updated)); window.dispatchEvent(new Event("amoon:favorites")); return true; } catch { return false; } } };
}
