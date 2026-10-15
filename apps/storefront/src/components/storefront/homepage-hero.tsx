import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n-server";
import { readHomepageSlider } from "@/lib/homepage-slider";
import daylight from "../../../public/images/editorial/hijab-beach.webp";
import mobileDaylight from "../../../public/images/editorial/hijab-beach-mobile.webp";
import styles from "./homepage-hero.module.css";

// Keep bespoke Admin copy; replace the old seeded slider with one editorial campaign.
export async function HomepageHero() {
  const [t, config] = await Promise.all([getTranslations(), readHomepageSlider({ url: process.env.MEDUSA_INTERNAL_URL || "", publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY })]);
  const saved = config?.configured ? config.slides[0] : undefined;
  if (config?.configured && !config.slides.length) return null;
  const bespoke = saved && saved.title !== "Des pièces qui vous\nressemblent.";
  const alt = t("Une femme en hijab et robe longue au bord de la mer.");
  const { props: mobile } = getImageProps({ src: mobileDaylight, alt, fill: true, sizes: "100vw" });
  return <section className={styles.hero} aria-labelledby="homepage-hero-title">
    <picture><source media="(max-width: 640px)" srcSet={mobile.srcSet} sizes="100vw"/><Image className={styles.photograph} src={daylight} alt={alt} fill sizes="100vw" loading="eager" fetchPriority="high" placeholder="blur"/></picture>
    <div className={styles.shade} aria-hidden="true"/>
    <div className={styles.copy}>
      <p className={styles.label}>{t("AMOON COLLECTION")}</p>
      <h1 id="homepage-hero-title">{t(bespoke ? saved.title : "Nouvelle Collection")}</h1>
      <p className={styles.subtitle}>{t(bespoke ? saved.description : "Élégance au quotidien")}</p>
      <Link className={styles.primary} href={bespoke ? saved.button_link : "/boutique"}>{t(bespoke ? saved.button_label : "Découvrir maintenant")}<span aria-hidden="true">{t("→")}</span></Link>
    </div>
    <p className={styles.note}>{t("Des lignes simples. Une allure singulière.")}</p>
  </section>;
}
