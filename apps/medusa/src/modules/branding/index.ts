import { Module } from "@medusajs/framework/utils";
import BrandingService from "./service";
export const BRANDING_MODULE = "branding";
export default Module(BRANDING_MODULE, { service: BrandingService });
