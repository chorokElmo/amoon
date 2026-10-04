"use client";
import Image from "next/image";
import { useState } from "react";
export function CatalogPhoto({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <Image src={src} alt={alt} fill sizes={sizes} onError={() => setFailed(true)}/> : <div className="catalog-image-placeholder" role="img" aria-label={alt + " — photographie indisponible"}><span aria-hidden="true">a.</span><small>{failed ? "Photographie indisponible" : "Photographie à venir"}</small></div>;
}
