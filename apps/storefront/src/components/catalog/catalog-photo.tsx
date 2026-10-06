"use client";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
export function CatalogPhoto({ src, alt, sizes, eager = false }: { src: string | null; alt: string; sizes: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <Image src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)}/> : <div className="catalog-image-placeholder" role="img" aria-label={alt + " — photographie indisponible"}><Icon name="shirt"/><small>{failed ? "Photographie indisponible" : "Photo à venir"}</small></div>;
}
