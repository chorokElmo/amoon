import { model } from "@medusajs/framework/utils";

export const SliderImage = model.define("amoon_slider_image", {
  id: model.id({ prefix: "simg" }).primaryKey(),
  file_id: model.text(),
  url: model.text(),
  mime_type: model.text(),
  width: model.number(),
  height: model.number(),
});
