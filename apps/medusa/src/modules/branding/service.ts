import { InjectManager, InjectTransactionManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils";
import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { BrandingConfig } from "./models/branding-config";
import { BrandingImage } from "./models/branding-image";
import type { BrandingAssets } from "../../lib/branding-validation";
import { ThemeSettings } from "./models/theme-settings";
import type { ThemePalette } from "../../lib/theme-palette";
import { HomepageContentSettings } from "./models/homepage-content-settings";
import type { HomepageContent } from "../../lib/homepage-content";

class BrandingService extends MedusaService({ BrandingConfig, BrandingImage, ThemeSettings, HomepageContentSettings }) {
  @InjectManager()
  async saveHomepageContent(action: "draft" | "publish", content: HomepageContent, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    return this.saveHomepageContent_(action, content, revision, context);
  }
  @InjectTransactionManager()
  protected async saveHomepageContent_(action: "draft" | "publish", content: HomepageContent, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    const manager = context?.transactionManager;
    if (!manager) throw new Error("Homepage content transaction manager unavailable");
    const json = JSON.stringify(content), publish = action === "publish";
    const rows = revision === 0
      ? await manager.execute("INSERT INTO amoon_homepage_content_settings (id, draft, published, revision, published_revision, created_at, updated_at) VALUES (?, ?::jsonb, ?::jsonb, 1, ?, now(), now()) ON CONFLICT (id) DO NOTHING RETURNING id", ["homepage", json, publish ? json : null, publish ? 1 : 0])
      : await manager.execute(publish
        ? "UPDATE amoon_homepage_content_settings SET draft = ?::jsonb, published = ?::jsonb, revision = revision + 1, published_revision = published_revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id"
        : "UPDATE amoon_homepage_content_settings SET draft = ?::jsonb, revision = revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id",
      publish ? [json, json, "homepage", revision] : [json, "homepage", revision]);
    if (!rows.length) throw new MedusaError(MedusaError.Types.CONFLICT, "Le contenu a été modifié ailleurs. Rechargez la page avant de réessayer.");
  }
  @InjectManager()
  async saveTheme(action: "draft" | "publish" | "reset", colors: ThemePalette | null, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    return this.saveTheme_(action, colors, revision, context);
  }
  @InjectTransactionManager()
  protected async saveTheme_(action: "draft" | "publish" | "reset", colors: ThemePalette | null, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    const manager = context?.transactionManager;
    if (!manager) throw new Error("Theme transaction manager unavailable");
    const draft = colors ? JSON.stringify(colors) : null;
    const publish = action !== "draft";
    const rows = revision === 0
      ? await manager.execute("INSERT INTO amoon_theme_settings (id, draft, published, revision, published_revision, created_at, updated_at) VALUES (?, ?::jsonb, ?::jsonb, 1, ?, now(), now()) ON CONFLICT (id) DO NOTHING RETURNING id", ["store", draft, publish ? draft : null, publish ? 1 : 0])
      : await manager.execute(publish
        ? "UPDATE amoon_theme_settings SET draft = ?::jsonb, published = ?::jsonb, revision = revision + 1, published_revision = published_revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id"
        : "UPDATE amoon_theme_settings SET draft = ?::jsonb, revision = revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id",
      publish ? [draft, draft, "store", revision] : [draft, "store", revision]);
    if (!rows.length) throw new MedusaError(MedusaError.Types.CONFLICT, "Le thème a été modifié ailleurs. Rechargez la page avant de réessayer.");
  }
  @InjectManager()
  async saveBranding(assets: BrandingAssets, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    return this.saveBranding_(assets, revision, context);
  }
  @InjectTransactionManager()
  protected async saveBranding_(assets: BrandingAssets, revision: number, @MedusaContext() context?: Context<EntityManager>) {
    const manager = context?.transactionManager;
    if (!manager) throw new Error("Branding transaction manager unavailable");
    const rows = revision === 0
      ? await manager.execute("INSERT INTO amoon_branding_config (id, assets, revision, created_at, updated_at) VALUES (?, ?::jsonb, 1, now(), now()) ON CONFLICT (id) DO NOTHING RETURNING id", ["store", JSON.stringify(assets)])
      : await manager.execute("UPDATE amoon_branding_config SET assets = ?::jsonb, revision = revision + 1, updated_at = now() WHERE id = ? AND revision = ? AND deleted_at IS NULL RETURNING id", [JSON.stringify(assets), "store", revision]);
    if (!rows.length) throw new MedusaError(MedusaError.Types.CONFLICT, "L’identité visuelle a été modifiée ailleurs. Rechargez la page avant de réessayer.");
    return { assets, revision: revision + 1 };
  }
}
export default BrandingService;
