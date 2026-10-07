import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import "./reference.css";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { locale } from "@/lib/i18n";
import { siteOrigin } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
  metadataBase: new URL(siteOrigin(process.env.STOREFRONT_URL)),
  title: { default: "Amoon Collection", template: "%s | Amoon Collection" },
  description: "Découvrez Amoon Collection : vêtements féminins au Maroc, nouveautés, ensembles et robes. Livraison partout au Maroc et paiement à la livraison.",
  applicationName: "Amoon Collection",
  robots: { index: !["localhost", "127.0.0.1", "[::1]"].includes(new URL(siteOrigin(process.env.STOREFRONT_URL)).hostname), follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: { siteName: "Amoon Collection", locale: "fr_MA", type: "website", images: [{ url: "/images/hero-amoon-rack.png", alt: "Collection Amoon" }] },
  twitter: { card: "summary_large_image", images: ["/images/hero-amoon-rack.png"] }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={locale.language} dir={locale.direction}><body><a className="skip-link" href="#main-content">Aller au contenu</a><Header/><main id="main-content" tabIndex={-1}>{children}</main><Footer/></body></html>;
}
