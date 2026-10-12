"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
export function CatalogPhoto({ src, alt, sizes, eager = false }: { src: string | null; alt: string; sizes: string; eager?: boolean }) {
  const t = useTranslations();
  const [failed, setFailed] = useState(false);
  return src && !failed ? <Image src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)}/> : <div className="catalog-image-placeholder" role="img" aria-label={alt + t(" — photographie indisponible")}><Icon name="shirt"/><small>{failed ? t("Photographie indisponible") : t("Photo à venir")}</small></div>;
}
