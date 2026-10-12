"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import type { ReactNode } from "react";
import { useWishlist } from "@/lib/wishlist";
export function FavoritesGrid({ cards }: { cards: { id: string; content: ReactNode }[] }) {
  const t = useTranslations();
  const {ids}=useWishlist();const saved=cards.filter(card=>ids.includes(card.id));
  return saved.length ? <div className="product-grid">{saved.map(card=><div key={card.id}>{card.content}</div>)}</div> : <div className="catalog-empty"><h2>{t("Les pièces que vous aimez.")}</h2><p>{t("Enregistrez vos coups de cœur avec le bouton cœur, puis retrouvez-les ici.")}</p><Link className="button button--primary" href="/boutique">{t("Explorer la boutique")}</Link></div>;
}
