import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http";
import { SaveSliderSchema, UploadSliderImageSchema } from "../lib/slider-validation";
import { SaveBrandingSchema, UploadBrandingSchema } from "../lib/branding-validation";
import { SaveThemeSchema } from "../lib/theme-validation";
import { SaveHomepageContentSchema } from "../lib/homepage-content-validation";
import { SaveStoreSettingsSchema } from "../lib/store-settings-validation";

export default defineMiddlewares({ routes: [
  { matcher: "/admin/store-settings*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/store-settings", method: "POST", bodyParser: { sizeLimit: "128kb" }, middlewares: [validateAndTransformBody(SaveStoreSettingsSchema)] },
  { matcher: "/admin/homepage-content*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/homepage-content", method: "POST", bodyParser: { sizeLimit: "128kb" }, middlewares: [validateAndTransformBody(SaveHomepageContentSchema)] },
  { matcher: "/admin/homepage-content/images", method: "POST", bodyParser: { sizeLimit: "15mb" }, middlewares: [validateAndTransformBody(UploadSliderImageSchema)] },
  { matcher: "/admin/theme*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/theme", method: "POST", bodyParser: { sizeLimit: "16kb" }, middlewares: [validateAndTransformBody(SaveThemeSchema)] },
  { matcher: "/admin/branding*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/branding", method: "POST", bodyParser: { sizeLimit: "16kb" }, middlewares: [validateAndTransformBody(SaveBrandingSchema)] },
  { matcher: "/admin/branding/images", method: "POST", bodyParser: { sizeLimit: "8mb" }, middlewares: [validateAndTransformBody(UploadBrandingSchema)] },
  { matcher: "/admin/homepage-slider*", middlewares: [authenticate("user", ["session", "bearer"])] },
  { matcher: "/admin/homepage-slider", method: "POST", bodyParser: { sizeLimit: "64kb" }, middlewares: [validateAndTransformBody(SaveSliderSchema)] },
  { matcher: "/admin/homepage-slider/images", method: "POST", bodyParser: { sizeLimit: "15mb" }, middlewares: [validateAndTransformBody(UploadSliderImageSchema)] },
] });
