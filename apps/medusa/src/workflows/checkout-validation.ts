import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";
import { codIssue } from "../lib/cod-validation";
// Runs inside Medusa's completion lock, against the same cart used to create the order.
completeCartWorkflow.hooks.validate(async ({ cart }) => { const issue = codIssue(cart); if (issue) throw new MedusaError(MedusaError.Types.INVALID_DATA, issue); });
