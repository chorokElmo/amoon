"use client";
import { useTranslations } from "@/components/storefront/language-provider";
import Link from "next/link";
import { useState } from "react";
import { CatalogPhoto } from "./catalog-photo";
export function CatalogCardGallery({ images, title, href, badge, imageFit = "contain" }: { images: string[]; title: string; href: string; badge: string | null; imageFit?: "contain" | "cover" }) {
  const t = useTranslations();
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, images.length - 1));
  const multiple = images.length > 1;
  return <div className="card-gallery">
    <div className="product-image" data-image-fit={imageFit}>
      <Link href={href} className="catalog-product-link" aria-label={t("Voir ") + title}>
        <CatalogPhoto key={images[index] || "missing"} src={images[index] || null} alt={title + (multiple ? t(" — vue ") + (index + 1) : "")} sizes="(max-width: 359px) 90vw, (max-width: 640px) 45vw, (max-width: 1100px) 30vw, 25vw"/>
      </Link>
      {badge && <span className="product-label">{badge}</span>}
      {multiple && <><button type="button" className="card-gallery-arrow card-gallery-arrow--previous" aria-label={t("Photo précédente de ") + title} onClick={() => setActive((index - 1 + images.length) % images.length)}>{t("‹")}</button><button type="button" className="card-gallery-arrow card-gallery-arrow--next" aria-label={t("Photo suivante de ") + title} onClick={() => setActive((index + 1) % images.length)}>{t("›")}</button><span className="card-gallery-counter" aria-live="polite">{index + 1}/{images.length}</span></>}
    </div>
    <div className="card-gallery-thumbnails" aria-label={multiple ? t("Photos de ") + title : undefined}>
      {multiple && images.map((src, i) => <button type="button" key={src} aria-label={t("Afficher la photo ") + (i + 1) + t(" de ") + title} aria-pressed={i === index} onClick={() => setActive(i)}><CatalogPhoto src={src} alt={title + t(" — miniature ") + (i + 1)} sizes="56px"/></button>)}
    </div>
  </div>;
}
