import { Module } from "@medusajs/framework/utils";
import HomepageSliderService from "./service";

export const HOMEPAGE_SLIDER_MODULE = "homepageSlider";
export default Module(HOMEPAGE_SLIDER_MODULE, { service: HomepageSliderService });
