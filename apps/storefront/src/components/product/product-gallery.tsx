"use client";
import { useState } from "react";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { Sheet } from "@/components/ui/sheet";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const src = images[index] || null;
  const alt = title + (images.length > 1 ? " — photographie " + (index + 1) : "");
  return <div className="product-gallery">
    {src ? <button className="product-gallery-main" type="button" onClick={() => setZoom(true)} aria-label={"Agrandir la photographie de " + title}><CatalogPhoto key={src} src={src} alt={alt} sizes="(max-width: 760px) 100vw, 55vw" eager/><span className="gallery-zoom-label">Agrandir</span></button> : <div className="product-gallery-main"><CatalogPhoto src={null} alt={title} sizes="100vw"/></div>}
    {images.length > 1 && <div className="product-thumbnails" aria-label="Photographies de la pièce">{images.map((image, number) => <button type="button" key={image} aria-label={"Voir la photographie " + (number + 1)} aria-pressed={number === index} onClick={() => setIndex(number)}><CatalogPhoto src={image} alt={title + " — photographie " + (number + 1)} sizes="80px"/></button>)}</div>}
    <Sheet open={zoom} onClose={() => setZoom(false)} title={title} kind="search"><div className="product-zoom-photo"><CatalogPhoto key={src || "none"} src={src} alt={alt} sizes="580px"/></div>{images.length > 1 && <div className="product-gallery-controls"><button type="button" onClick={() => setIndex((index + images.length - 1) % images.length)}>Précédente</button><span aria-live="polite">{index + 1} / {images.length}</span><button type="button" onClick={() => setIndex((index + 1) % images.length)}>Suivante</button></div>}</Sheet>
  </div>;
}
