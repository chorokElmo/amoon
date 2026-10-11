import { model } from "@medusajs/framework/utils";

export const SliderConfig = model.define("amoon_slider_config", {
  id: model.id().primaryKey(),
  slides: model.json(),
  revision: model.number().default(0),
});
