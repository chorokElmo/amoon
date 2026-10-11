import { model } from "@medusajs/framework/utils";
export const BrandingConfig = model.define("amoon_branding_config", {
  id: model.id().primaryKey(), assets: model.json(), revision: model.number().default(0),
});
