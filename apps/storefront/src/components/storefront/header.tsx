"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { fr } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Wordmark } from "./wordmark";
import type { LogoImage } from "./wordmark";
import { CartLink } from "@/components/cart/cart-link";
import { CartDrawer } from "@/components/cart/cart-drawer";
import type { HomepageContent } from "@/lib/homepage-content";
export function Header({ logo, announcement, storeName = "Amoon Collection", cod = true, customExchange = false }: { logo?: LogoImage; announcement?: HomepageContent["announcement"]; storeName?: string; cod?: boolean; customExchange?: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [panel, setPanel] = useState<"menu" | "search" | "cart" | null>(null);
  const close = () => setPanel(null);
  useEffect(() => { const open = () => setPanel("cart"); window.addEventListener("amoon:open-cart", open); return () => window.removeEventListener("amoon:open-cart", open); }, []);
  const navigation = fr.navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{t(label)}</Link>);
  return <>
    {(!announcement || announcement.enabled) && <div className="announcement" style={announcement?.background && announcement.color ? { background: announcement.background, color: announcement.color } : undefined}><span><Icon name="truck"/>{announcement?.url ? <Link href={announcement.url}>{t(announcement.text)}</Link> : t(announcement?.text || fr.announcement)}</span>{cod && <span><Icon name="card"/>{t("Paiement à la livraison")}</span>}<span><Icon name="exchange"/>{customExchange ? t("Retours & échanges") : t("Échange facile sous 7 jours")}</span></div>}
    <header className="store-header"><div className="header-main container">
      <button type="button" className="icon-button mobile-menu" aria-label={t(fr.menu)} aria-haspopup="dialog" aria-expanded={panel === "menu"} onClick={() => setPanel("menu")}><Icon name="menu"/></button>
      <Wordmark logo={logo}/>
      <nav className="desktop-nav" aria-label={t("Navigation principale")}>{navigation}</nav>
      <div className="header-actions"><div className="desktop-language"><LanguageSwitcher/></div><button type="button" className="icon-button" aria-label={t(fr.search)} aria-haspopup="dialog" aria-expanded={panel === "search"} onClick={() => setPanel("search")}><Icon name="search"/></button><Link className="icon-button" href="/favoris" aria-label={t("Mes favoris")}><Icon name="heart"/></Link><CartLink onClick={() => setPanel("cart")}/></div>
    </div><div className="mobile-language container"><LanguageSwitcher/></div></header>
    <Sheet open={panel === "menu"} onClose={close} title={storeName}><LanguageSwitcher/><nav className="mobile-nav" aria-label={t("Navigation mobile")}>{navigation}</nav><div className="menu-services" aria-label={t("Les services Amoon")}><span><Icon name="truck"/>{t("Livraison partout au Maroc")}</span>{cod && <span><Icon name="card"/>{t("Paiement à la livraison")}</span>}<span><Icon name="exchange"/>{customExchange ? t("Retours & échanges") : t("Échange sous 7 jours")}</span></div><p className="sheet-note">{t("La mode féminine, avec élégance.")}</p></Sheet>
    <Sheet open={panel === "search"} onClose={close} title={t(fr.searchTitle)} kind="search"><form action="/boutique" method="get" className="search-form" onSubmit={close}>
      <label htmlFor="store-search">{t(fr.searchLabel)}</label><input id="store-search" name="q" type="search" maxLength={100} placeholder={t(fr.searchPlaceholder)} required/><Button type="submit">{t(fr.search)}<Icon name="arrow"/></Button>
    </form></Sheet>
    <Sheet open={panel === "cart"} onClose={close} title={t("Votre panier")} kind="cart">{panel === "cart" && <CartDrawer onNavigate={close}/>}</Sheet>
  </>;
}
