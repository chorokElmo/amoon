"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { HomepageSlide } from "@/lib/homepage-slider";
import styles from "./homepage-hero.module.css";

export function HeroSlider({ slides }: { slides: HomepageSlide[] }) {
  const [active, setActive] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const change = (index: number) => setActive((index + slides.length) % slides.length);
  const slide = slides[active % slides.length];
  const [title, ...accent] = slide.title.split("\n");
  return <section className={styles.hero} aria-labelledby="homepage-hero-title" aria-roledescription="carrousel" tabIndex={0} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight") { event.preventDefault(); change(active + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); change(active - 1); }
  }}>
    <div className={styles.copy}><div className={styles.message}>
      {slide.eyebrow && <p className={styles.label}>{slide.eyebrow}</p>}
      <h1 id="homepage-hero-title" className={styles.slideTitle}>{title}{accent.length > 0 && <><br/><em>{accent.join("\n")}</em></>}</h1>
      {slide.description && <p className={`${styles.description} ${styles.slideDescription}`}>{slide.description}</p>}
      <div className={styles.actions}><Link className={styles.primary} href={slide.button_link}>{slide.button_label} <span aria-hidden="true">→</span></Link>{slide.secondary_label && <Link className={styles.secondary} href={slide.secondary_link}>{slide.secondary_label}</Link>}</div>
    </div><div className={styles.benefits}><div><Icon name="truck"/><span>Livraison partout<br/>au Maroc</span></div><div><Icon name="card"/><span>Paiement<br/>à la livraison</span></div><div><Icon name="exchange"/><span>Échange<br/>sous 7 jours</span></div></div>
      {slides.length > 1 && <div className={styles.sliderControls}><span className={styles.counter} aria-live="polite"><strong>{String(active + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")}</span><div className={styles.progress} aria-label="Choisir une diapositive">{slides.map((item, index) => <button key={item.id} type="button" aria-label={`Afficher la diapositive ${index + 1} : ${item.title}`} aria-current={active === index ? "true" : undefined} onClick={() => change(index)}/>)}</div><div className={styles.arrows}><button type="button" aria-label="Vue précédente" onClick={() => change(active - 1)}>‹</button><button type="button" aria-label="Vue suivante" onClick={() => change(active + 1)}>›</button></div></div>}
    </div>
    <div className={styles.photo} onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={event => {
      if (!touch.current) return;
      const point = event.changedTouches[0]; const dx = point.clientX - touch.current.x; const dy = point.clientY - touch.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) change(active + (dx < 0 ? 1 : -1));
      touch.current = null;
    }}><Image key={slide.id} src={slide.image_url} alt={slide.image_alt} fill quality={90} loading="eager" sizes="(max-width: 800px) 100vw, 55vw" style={{ objectPosition: slide.position, transform: `scale(${slide.zoom})`, transformOrigin: slide.position }}/></div>
  </section>;
}
