import { InjectManager, InjectTransactionManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils";
import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { SliderConfig } from "./models/slider-config";
import { SliderImage } from "./models/slider-image";
import type { Slide } from "../../lib/slider-validation";

class HomepageSliderService extends MedusaService({ SliderConfig, SliderImage }) {
  @InjectManager()
  async saveSlides(slides: Slide[], revision: number, @MedusaContext() context?: Context<EntityManager>) {
    return this.saveSlides_(slides, revision, context);
  }

  @InjectTransactionManager()
  protected async saveSlides_(slides: Slide[], revision: number, @MedusaContext() context?: Context<EntityManager>) {
    const manager = context?.transactionManager;
    if (!manager) throw new Error("Slider transaction manager unavailable");
    // Compare and replace the complete ordered list atomically. Stale editors cannot overwrite a newer save.
    const rows = revision === 0
      ? await manager.execute("INSERT INTO amoon_slider_config (id, slides, revision, created_at, updated_at) VALUES (?, ?::jsonb, 1, now(), now()) ON CONFLICT (id) DO NOTHING RETURNING id", ["homepage", JSON.stringify(slides)])
      : await manager.execute("UPDATE amoon_slider_config SET slides = ?::jsonb, revision = revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id", [JSON.stringify(slides), "homepage", revision]);
    if (!rows.length) throw new MedusaError(MedusaError.Types.CONFLICT, "Les bannières ont été modifiées ailleurs. Rechargez la page avant de réessayer.");
    return { configured: true, slides, revision: revision + 1 };
  }
}

export default HomepageSliderService;
