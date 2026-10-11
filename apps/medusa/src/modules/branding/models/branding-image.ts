import { model } from "@medusajs/framework/utils";
export const BrandingImage = model.define("amoon_branding_image", {
  id: model.id({ prefix: "bimg" }).primaryKey(), file_id: model.text(), url: model.text(),
  slot: model.enum(["header_logo", "footer_logo", "favicon"]), mime_type: model.text(), width: model.number(), height: model.number(),
});
