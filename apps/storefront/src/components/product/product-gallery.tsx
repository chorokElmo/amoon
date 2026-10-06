"use client";
import { useState } from "react";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { Sheet } from "@/components/ui/sheet";
import { WishlistButton } from "@/components/catalog/product-actions";
export function ProductGallery({ images, title, productId, isNew = false, imageFit = "contain" }: { images: string[]; title: string; productId: string; isNew?: boolean; imageFit?: "contain" | "cover" }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const active = Math.min(index, Math.max(0, images.length - 1));
  const src = images[active] || null;
  const alt = title + (images.length > 1 ? " — photographie " + (active + 1) : "");
  const move = (direction: number) => setIndex((active + direction + images.length) % images.length);
  const controls = images.length > 1 && <><button className="pdp-gallery-arrow pdp-gallery-arrow--previous" type="button" aria-label="Photo précédente" onClick={() => move(-1)}>‹</button><button className="pdp-gallery-arrow pdp-gallery-arrow--next" type="button" aria-label="Photo suivante" onClick={() => move(1)}>›</button></>;
  return <div className={"product-gallery product-gallery--" + imageFit}>
    <div className="pdp-gallery-frame">
      {src ? <button className="product-gallery-main" type="button" onClick={() => setZoom(true)} aria-label={"Agrandir la photographie de " + title}><CatalogPhoto key={src} src={src} alt={alt} sizes="(max-width: 760px) 95vw, 55vw" eager/></button> : <div className="product-gallery-main"><CatalogPhoto src={null} alt={title} sizes="100vw"/></div>}
      {isNew && <span className="pdp-new-badge">Nouveau</span>}
      <WishlistButton id={productId} title={title}/>
      {controls}
      {src && <><span className="pdp-gallery-counter" aria-live="polite">{active + 1}/{images.length}</span><button type="button" className="pdp-zoom-button" aria-label="Ouvrir le grand aperçu" onClick={() => setZoom(true)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg></button></>}
    </div>
    {images.length > 1 && <div className="product-thumbnails" aria-label="Photographies de la pièce">{images.map((image, number) => <button type="button" key={image} aria-label={"Voir la photographie " + (number + 1)} aria-pressed={number === active} onClick={() => setIndex(number)}><CatalogPhoto src={image} alt={title + " — photographie " + (number + 1)} sizes="(max-width: 760px) 80px, 140px"/></button>)}</div>}
    <Sheet open={zoom} onClose={() => setZoom(false)} title={title} kind="search"><div className="product-zoom-photo"><CatalogPhoto key={src || "none"} src={src} alt={alt} sizes="90vw"/>{controls}</div>{images.length > 1 && <p className="pdp-zoom-counter" aria-live="polite">{active + 1} / {images.length}</p>}</Sheet>
  </div>;
}
