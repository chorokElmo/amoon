"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { usePathname } from "next/navigation";
import type { Cart } from "@/lib/medusa-cart";
export function CartLink({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let active = true; let version = 0;
    const refresh = async () => {
      const current = ++version;
      try { const response = await fetch("/api/cart", { cache: "no-store" }); const data: { cart: Cart | null } = await response.json(); if (active && current === version) setCount(response.ok ? data.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0 : null); } catch { if (active && current === version) setCount(null); }
    };
    void refresh(); window.addEventListener("amoon:cart", refresh); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("amoon:cart", refresh); window.removeEventListener("focus", refresh); };
  }, [pathname]);
  return <Link href="/panier" className="icon-button cart-link" aria-label={count ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"} onClick={onClick}><Icon name="bag"/>{count !== null && count > 0 && <span className="cart-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</Link>;
}
