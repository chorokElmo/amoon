import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http";
import { SaveSliderSchema, UploadSliderImageSchema } from "../lib/slider-validation";
import { SaveBrandingSchema, UploadBrandingSchema } from "../lib/branding-validation";

export default defineMiddlewares({ routes: [
  { matcher: "/admin/branding*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/branding", method: "POST", bodyParser: { sizeLimit: "16kb" }, middlewares: [validateAndTransformBody(SaveBrandingSchema)] },
  { matcher: "/admin/branding/images", method: "POST", bodyParser: { sizeLimit: "8mb" }, middlewares: [validateAndTransformBody(UploadBrandingSchema)] },
  { matcher: "/admin/homepage-slider*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/homepage-slider", method: "POST", bodyParser: { sizeLimit: "64kb" }, middlewares: [validateAndTransformBody(SaveSliderSchema)] },
  { matcher: "/admin/homepage-slider/images", method: "POST", bodyParser: { sizeLimit: "15mb" }, middlewares: [validateAndTransformBody(UploadSliderImageSchema)] },
] });
