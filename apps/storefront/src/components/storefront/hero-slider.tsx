"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

import styles from "./homepage-hero.module.css";

const views = [{name:"La collection",position:"center",zoom:1},{name:"Les pièces bordeaux",position:"right center",zoom:1.2},{name:"Les matières douces",position:"left bottom",zoom:1.35}];
export function HeroSlider({ src, alt }: {src:string;alt:string}) {
  const [active,setActive]=useState(0);
  const touch=useRef<{x:number;y:number}|null>(null);
  const change=(index:number)=>setActive((index+views.length)%views.length);
  return <section className={styles.hero} aria-labelledby="homepage-hero-title" aria-roledescription="carrousel" tabIndex={0} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==="ArrowRight"){event.preventDefault();change(active+1);}if(event.key==="ArrowLeft"){event.preventDefault();change(active-1);}}}>
    <div className={styles.copy}><div className={styles.message}>
      <p className={styles.label}>NOUVELLE COLLECTION · AMOON</p>
      <h1 id="homepage-hero-title">Des pièces qui vous<br/><em>ressemblent.</em></h1>
      <p className={styles.description}>Confortables, féminines et faciles à porter. <br/>Découvrez la nouvelle collection Amoon.</p>
      <div className={styles.actions}><Link className={styles.primary} href="/boutique">DÉCOUVRIR LA COLLECTION <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/nouveautes">Voir les nouveautés</Link></div>
    </div><div className={styles.benefits}><div><Icon name="truck"/><span>Livraison partout<br/>au Maroc</span></div><div><Icon name="card"/><span>Paiement<br/>à la livraison</span></div><div><Icon name="exchange"/><span>Échange<br/>sous 7 jours</span></div></div><div className={styles.sliderControls}><span className={styles.counter} aria-live="polite"><strong>{String(active+1).padStart(2,"0")}</strong> / 03</span><div className={styles.progress} aria-label="Choisir une vue">{views.map((view,index)=><button key={view.name} type="button" aria-label={"Afficher la vue "+(index+1)+" : "+view.name} aria-current={active===index?"true":undefined} onClick={()=>change(index)}/>)}</div><div className={styles.arrows}><button type="button" aria-label="Vue précédente" onClick={()=>change(active-1)}>‹</button><button type="button" aria-label="Vue suivante" onClick={()=>change(active+1)}>›</button></div></div></div>
    <div className={styles.photo} onTouchStart={event=>{const t=event.touches[0];touch.current={x:t.clientX,y:t.clientY};}} onTouchEnd={event=>{if(!touch.current)return;const t=event.changedTouches[0];const dx=t.clientX-touch.current.x;const dy=t.clientY-touch.current.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))change(active+(dx<0?1:-1));touch.current=null;}}><Image src={src} alt={alt+" — "+views[active].name} fill quality={90} loading="eager" sizes="(max-width: 800px) 100vw, 55vw" style={{objectPosition:views[active].position,transform:"scale("+views[active].zoom+")",transformOrigin:views[active].position}}/></div>
  </section>;
}


