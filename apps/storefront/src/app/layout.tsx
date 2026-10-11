import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import "./reference.css";
import "./theme.css";
import "./homepage-content.css";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { locale } from "@/lib/i18n";
import { siteOrigin } from "@/lib/seo";
import { getStoreBranding } from "@/lib/store-branding";
import { getStoreTheme } from "@/lib/store-theme";
import { getStoreHomepageContent } from "@/lib/store-homepage-content";
import { getStoreConfig } from "@/lib/store-config";
import { defaultStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const branding = await getStoreBranding();
  const { settings } = await getStoreConfig();
  return {
  metadataBase: new URL(siteOrigin(process.env.STOREFRONT_URL)),
  title: { default: settings.info.name, template: `%s | ${settings.info.name}` },
  description: "Découvrez Amoon Collection : vêtements féminins au Maroc, nouveautés, ensembles et robes. Livraison partout au Maroc et paiement à la livraison.",
  applicationName: settings.info.name,
  icons: { icon: branding.favicon ? { url: branding.favicon.src, type: "image/png", sizes: `${branding.favicon.width}x${branding.favicon.height}` } : { url: "/images/favicon-default.svg", type: "image/svg+xml", sizes: "any" } },
  robots: { index: !["localhost", "127.0.0.1", "[::1]"].includes(new URL(siteOrigin(process.env.STOREFRONT_URL)).hostname), follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: { siteName: "Amoon Collection", locale: "fr_MA", type: "website", images: [{ url: "/images/hero-amoon-rack.png", alt: "Collection Amoon" }] },
  twitter: { card: "summary_large_image", images: ["/images/hero-amoon-rack.png"] }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [branding, theme, homepage, config] = await Promise.all([getStoreBranding(), getStoreTheme(), getStoreHomepageContent(), getStoreConfig()]);
  return <html lang={locale.language} dir={locale.direction} data-site-theme={theme.properties ? theme.revision : undefined} style={theme.properties}><body><a className="skip-link" href="#main-content">Aller au contenu</a><Header logo={branding.headerLogo} announcement={homepage.announcement} storeName={config.settings.info.name} cod={config.settings.payment.cod} customExchange={config.settings.policies.exchange !== defaultStoreSettings().policies.exchange}/><main id="main-content" tabIndex={-1}>{children}</main><Footer logo={branding.footerLogo}/><WhatsAppButton/></body></html>;
}
