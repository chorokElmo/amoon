import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import AmoonManualFulfillmentService from "./service";
export default ModuleProvider(Modules.FULFILLMENT, { services: [AmoonManualFulfillmentService] });
