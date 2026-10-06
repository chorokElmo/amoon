"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fr } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Wordmark } from "./wordmark";
import { CartLink } from "@/components/cart/cart-link";
import { CartDrawer } from "@/components/cart/cart-drawer";
export function Header() {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"menu" | "search" | "cart" | null>(null);
  const close = () => setPanel(null);
  useEffect(() => { const open = () => setPanel("cart"); window.addEventListener("amoon:open-cart", open); return () => window.removeEventListener("amoon:open-cart", open); }, []);
  const navigation = fr.navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>);
  return <>
    <div className="announcement"><span><Icon name="truck"/>{fr.announcement}</span><span><Icon name="card"/>Paiement à la livraison</span><span><Icon name="exchange"/>Échange facile sous 7 jours</span></div>
    <header className="store-header"><div className="header-main container">
      <button type="button" className="icon-button mobile-menu" aria-label={fr.menu} aria-haspopup="dialog" aria-expanded={panel === "menu"} onClick={() => setPanel("menu")}><Icon name="menu"/></button>
      <Wordmark/>
      <nav className="desktop-nav" aria-label="Navigation principale">{navigation}</nav>
      <div className="header-actions"><button type="button" className="icon-button" aria-label={fr.search} aria-haspopup="dialog" aria-expanded={panel === "search"} onClick={() => setPanel("search")}><Icon name="search"/></button><Link className="icon-button" href="/favoris" aria-label="Mes favoris"><Icon name="heart"/></Link><CartLink onClick={() => setPanel("cart")}/></div>
    </div></header>
    <Sheet open={panel === "menu"} onClose={close} title="Amoon Collection"><nav className="mobile-nav" aria-label="Navigation mobile">{navigation}</nav><div className="menu-services" aria-label="Les services Amoon"><span><Icon name="truck"/>Livraison partout au Maroc</span><span><Icon name="card"/>Paiement à la livraison</span><span><Icon name="exchange"/>Échange sous 7 jours</span></div><p className="sheet-note">La mode féminine, avec élégance.</p></Sheet>
    <Sheet open={panel === "search"} onClose={close} title={fr.searchTitle} kind="search"><form action="/boutique" method="get" className="search-form" onSubmit={close}>
      <label htmlFor="store-search">{fr.searchLabel}</label><input id="store-search" name="q" type="search" maxLength={100} placeholder={fr.searchPlaceholder} required/><Button type="submit">{fr.search}<Icon name="arrow"/></Button>
    </form></Sheet>
    <Sheet open={panel === "cart"} onClose={close} title="Votre panier" kind="cart">{panel === "cart" && <CartDrawer onNavigate={close}/>}</Sheet>
  </>;
}
