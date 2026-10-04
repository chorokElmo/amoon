"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { fr } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Wordmark } from "./wordmark";
import { CartLink } from "@/components/cart/cart-link";
export function Header() {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);
  const close = () => setPanel(null);
  const navigation = fr.navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>);
  return <>
    <div className="announcement">{fr.announcement}</div>
    <header className="store-header"><div className="header-main container">
      <button type="button" className="icon-button mobile-menu" aria-label={fr.menu} aria-haspopup="dialog" aria-expanded={panel === "menu"} onClick={() => setPanel("menu")}><Icon name="menu"/></button>
      <Wordmark/>
      <nav className="desktop-nav" aria-label="Navigation principale">{navigation}</nav>
      <div className="header-actions"><button type="button" className="icon-button" aria-label={fr.search} aria-haspopup="dialog" aria-expanded={panel === "search"} onClick={() => setPanel("search")}><Icon name="search"/></button><CartLink onClick={close}/></div>
    </div></header>
    <Sheet open={panel === "menu"} onClose={close} title="Amoon Collection"><nav className="mobile-nav" aria-label="Navigation mobile">{navigation}</nav><p className="sheet-note">La mode féminine, avec élégance.</p></Sheet>
    <Sheet open={panel === "search"} onClose={close} title={fr.searchTitle} kind="search"><form action="/boutique" method="get" className="search-form" onSubmit={close}>
      <label htmlFor="store-search">{fr.searchLabel}</label><input id="store-search" name="q" type="search" maxLength={100} placeholder={fr.searchPlaceholder} required/><Button type="submit">{fr.search}<Icon name="arrow"/></Button>
    </form></Sheet>
  </>;
}
