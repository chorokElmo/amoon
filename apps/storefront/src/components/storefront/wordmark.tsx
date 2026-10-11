import Link from "next/link";
import Image from "next/image";

export type LogoImage = { src: string; width: number; height: number };
export function Wordmark({ logo, eager = true }: { logo?: LogoImage; eager?: boolean }) {
  return <Link href="/" className={`wordmark${logo ? "" : " wordmark-default"}`} aria-label="Amoon Collection — Accueil"><Image src={logo?.src || "/images/amoon-logo-black.png"} alt="Amoon Collection" width={logo?.width || 1774} height={logo?.height || 887} sizes="(max-width: 640px) 120px, 180px" loading={eager ? "eager" : "lazy"} unoptimized={Boolean(logo)}/></Link>;
}
