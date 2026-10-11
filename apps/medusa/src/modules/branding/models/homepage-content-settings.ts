import { model } from "@medusajs/framework/utils";
export const HomepageContentSettings = model.define("amoon_homepage_content_settings", {
  id: model.id().primaryKey(), draft: model.json().nullable(), published: model.json().nullable(),
  revision: model.number().default(0), published_revision: model.number().default(0),
});
