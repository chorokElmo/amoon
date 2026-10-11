import { InjectManager, InjectTransactionManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils";
import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { BrandingConfig } from "./models/branding-config";
import { BrandingImage } from "./models/branding-image";
import type { BrandingAssets } from "../../lib/branding-validation";

class BrandingService extends MedusaService({ BrandingConfig, BrandingImage }) {
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
