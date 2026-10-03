import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amoon Collection", template: "%s | Amoon Collection" },
  description: "La mode féminine, avec élégance. Amoon Collection, boutique au Maroc."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" dir="ltr"><body>{children}</body></html>;
}
