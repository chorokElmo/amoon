import Link from "next/link";
import Image from "next/image";

export function Wordmark() {
  return <Link href="/" className="wordmark" aria-label="Amoon Collection — Accueil"><Image src="/images/amoon-logo-black.png" alt="Amoon Collection" width={1774} height={887} sizes="(max-width: 640px) 120px, 180px" loading="eager"/></Link>;
}
