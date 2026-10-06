"use client";
import Link from "next/link";
import { useState } from "react";
import { CatalogPhoto } from "./catalog-photo";
export function CatalogCardGallery({ images, title, href, badge }: { images: string[]; title: string; href: string; badge: string | null }) {
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, images.length - 1));
  const multiple = images.length > 1;
  return <div className="card-gallery">
    <div className="product-image">
      <Link href={href} className="catalog-product-link" aria-label={"Voir " + title}>
        <CatalogPhoto key={images[index] || "missing"} src={images[index] || null} alt={title + (multiple ? " — vue " + (index + 1) : "")} sizes="(max-width: 360px) 90vw, (max-width: 800px) 45vw, 30vw"/>
      </Link>
      {badge && <span className="product-label">{badge}</span>}
      {multiple && <><button type="button" className="card-gallery-arrow card-gallery-arrow--previous" aria-label={"Photo précédente de " + title} onClick={() => setActive((index - 1 + images.length) % images.length)}>‹</button><button type="button" className="card-gallery-arrow card-gallery-arrow--next" aria-label={"Photo suivante de " + title} onClick={() => setActive((index + 1) % images.length)}>›</button><span className="card-gallery-counter" aria-live="polite">{index + 1}/{images.length}</span></>}
    </div>
    <div className="card-gallery-thumbnails" aria-label={multiple ? "Photos de " + title : undefined}>
      {multiple && images.map((src, i) => <button type="button" key={src} aria-label={"Afficher la photo " + (i + 1) + " de " + title} aria-pressed={i === index} onClick={() => setActive(i)}><CatalogPhoto src={src} alt={title + " — miniature " + (i + 1)} sizes="56px"/></button>)}
    </div>
  </div>;
}
