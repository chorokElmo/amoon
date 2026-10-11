import { model } from "@medusajs/framework/utils";
export const ThemeSettings = model.define("amoon_theme_settings", {
  id: model.id().primaryKey(), draft: model.json().nullable(), published: model.json().nullable(),
  revision: model.number().default(0), published_revision: model.number().default(0),
});
