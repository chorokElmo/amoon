import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { locale } from "@/lib/i18n";
import { siteOrigin } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
  metadataBase: new URL(siteOrigin(process.env.STOREFRONT_URL)),
  title: { default: "Amoon Collection", template: "%s | Amoon Collection" },
  description: "La mode féminine, avec élégance. Amoon Collection, boutique au Maroc."
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={locale.language} dir={locale.direction}><body><a className="skip-link" href="#main-content">Aller au contenu</a><Header/><main id="main-content" tabIndex={-1}>{children}</main><Footer/></body></html>;
}
