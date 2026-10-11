import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http";
import { SaveSliderSchema, UploadSliderImageSchema } from "../lib/slider-validation";

export default defineMiddlewares({ routes: [
  { matcher: "/admin/homepage-slider*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/homepage-slider", method: "POST", bodyParser: { sizeLimit: "64kb" }, middlewares: [validateAndTransformBody(SaveSliderSchema)] },
  { matcher: "/admin/homepage-slider/images", method: "POST", bodyParser: { sizeLimit: "15mb" }, middlewares: [validateAndTransformBody(UploadSliderImageSchema)] },
] });
