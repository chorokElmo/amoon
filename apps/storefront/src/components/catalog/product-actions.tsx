"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { changeCart } from "@/lib/cart-client";
import type { CatalogVariant } from "@/lib/catalog-model";
import { Icon } from "@/components/ui/icon";

export function WishlistButton({ id, title }: { id: string; title: string }) {
  const { ids, toggle } = useWishlist(); const saved = ids.includes(id); const [error,setError]=useState("");
  return <><button type="button" className="wishlist-button" aria-pressed={saved} aria-label={(saved ? "Retirer des favoris : " : "Enregistrer dans les favoris : ") + title} onClick={()=>setError(toggle(id)?"":"Les favoris ne peuvent pas être enregistrés sur cet appareil.")}><Icon name="heart"/></button>{error && <span className="favorite-error" role="alert">{error}</span>}</>;
}
export function QuickAdd({ productId, href, variants }: { productId: string; href: string; variants: CatalogVariant[] }) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const lock=useRef(false);
  const variant=variants.length===1 ? variants[0] : null;
  const eligible=variant && variant.price!==null && ["in_stock","backorder"].includes(variant.stock);
  async function add() { if(!variant||!eligible||lock.current)return;lock.current=true;setBusy(true);setError("");try {await changeCart({action:"add",productId,variantId:variant.id,quantity:1});window.dispatchEvent(new Event("amoon:open-cart"));}catch(e){setError(e instanceof Error?e.message:"L’ajout est indisponible.");}finally{lock.current=false;setBusy(false);} }
  return <div className="quick-add">{eligible ? <button type="button" className="button button--outline" disabled={busy} onClick={()=>void add()}><Icon name="bag"/>{busy?"Ajout…":"Ajouter au panier"}</button> : <Link className="button button--outline" href={href}>{variants.length>1?"Choisir mes options":"Découvrir la pièce"}<Icon name="arrow"/></Link>}{error&&<p role="alert">{error}</p>}</div>;
}
