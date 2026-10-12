"use client";
import { useLanguage, useTranslations } from "@/components/storefront/language-provider";
import { useRef, useState, type PointerEvent } from "react";
import { CatalogPhoto } from "@/components/catalog/catalog-photo";
import { Sheet } from "@/components/ui/sheet";
import { WishlistButton } from "@/components/catalog/product-actions";
export function ProductGallery({ images, title, productId, isNew = false, imageFit = "contain" }: { images: string[]; title: string; productId: string; isNew?: boolean; imageFit?: "contain" | "cover" }) {
  const t = useTranslations();
  const { language } = useLanguage();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const active = Math.min(index, Math.max(0, images.length - 1));
  const src = images[active] || null;
  const alt = title + (images.length > 1 ? t(" — photographie ") + (active + 1) : "");
  const move = (direction: number) => setIndex((active + direction + images.length) % images.length);
  function startSwipe(event: PointerEvent<HTMLElement>) {
    swiped.current = false;
    if (images.length < 2 || event.pointerType === "mouse") return;
    gesture.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function endSwipe(event: PointerEvent<HTMLElement>) {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x;
    const dy = event.clientY - gesture.current.y;
    gesture.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      move((dx < 0 ? 1 : -1) * (language === "ar" ? -1 : 1));
    }
  }
  const controls = images.length > 1 && <><button className="pdp-gallery-arrow pdp-gallery-arrow--previous" type="button" aria-label={t("Photo précédente")} onClick={() => move(-1)}>{t("‹")}</button><button className="pdp-gallery-arrow pdp-gallery-arrow--next" type="button" aria-label={t("Photo suivante")} onClick={() => move(1)}>{t("›")}</button></>;
  return <div className={"product-gallery product-gallery--" + imageFit}>
    <div className="pdp-gallery-frame">
      {src ? <button className="product-gallery-main" type="button" onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }} onClick={() => { if (!swiped.current) setZoom(true); swiped.current = false; }} aria-label={t("Agrandir la photographie de ") + title}><span className="pdp-photo" key={src}><CatalogPhoto src={src} alt={alt} sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1400px) 50vw, 700px" eager/></span></button> : <div className="product-gallery-main"><CatalogPhoto src={null} alt={title} sizes="100vw"/></div>}
      {isNew && <span className="pdp-new-badge">{t("Nouveau")}</span>}
      <WishlistButton id={productId} title={title}/>
      {controls}
      {src && <><span className="pdp-gallery-counter" aria-live="polite">{active + 1}/{images.length}</span><button type="button" className="pdp-zoom-button" aria-label={t("Ouvrir le grand aperçu")} onClick={() => setZoom(true)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg></button></>}
    </div>
    {images.length > 1 && <div className="product-thumbnails" aria-label={t("Photographies de la pièce")}>{images.map((image, number) => <button type="button" key={image} aria-label={t("Voir la photographie ") + (number + 1)} aria-pressed={number === active} onClick={() => setIndex(number)}><CatalogPhoto src={image} alt={title + t(" — photographie ") + (number + 1)} sizes="(max-width: 760px) 80px, 140px"/></button>)}</div>}
    <Sheet open={zoom} onClose={() => setZoom(false)} title={title} kind="gallery">{zoom && <><div className="product-zoom-photo"><span className="pdp-photo" key={src || "none"} onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }}><CatalogPhoto src={src} alt={alt} sizes="90vw"/></span>{controls}</div>{images.length > 1 && <p className="pdp-zoom-counter" aria-live="polite">{active + 1} / {images.length}</p>}</>}</Sheet>
  </div>;
}
