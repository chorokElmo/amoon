import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { acquireLockStep, releaseLockStep, updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";
import type { FulfillmentWorkflow } from "@medusajs/framework/types";
import { readNativeStoreSettings, settingsConnection } from "../lib/store-settings-db";
import type { StoreSettings } from "../lib/store-settings";
import { manageableShipping, nativeShippingOptions, type ShippingBackup } from "../lib/store-settings-shipping";
import { BRANDING_MODULE } from "../modules/branding";
import type BrandingService from "../modules/branding/service";
type Input = { settings: StoreSettings; revision: number };
const prepare = createStep("amoon-prepare-store-settings", async (input: Input, { container }) => {
  const current = await readNativeStoreSettings(settingsConnection(container));
  if (current.revision !== input.revision) throw new MedusaError(MedusaError.Types.CONFLICT, "Les paramètres ont changé. Rechargez la page.");
  const options = await nativeShippingOptions(container);
  const backups = { ...(current.metadata.amoon_delivery_backups as Record<string, ShippingBackup> || {}) };
  const updates: FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput[] = [];
  for (const managed of input.settings.delivery) {
    const option = options.find(o => o.id === managed.id);
    if (!option || !manageableShipping(option)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cette option comporte des règles avancées ou n’existe plus. Utilisez la gestion Livraison de Medusa.");
    if (!backups[option.id]) backups[option.id] = { name: option.name, data: option.data || {}, amount: Number(option.prices![0].amount) };
    if (option.price_type !== "calculated" || option.name !== managed.name) updates.push({ id: option.id, name: managed.name, price_type: "calculated", data: { ...option.data, amoon_delivery_id: option.id } });
  }
  for (const previous of current.settings.delivery) {
    if (input.settings.delivery.some(o => o.id === previous.id)) continue;
    const backup = backups[previous.id], option = options.find(o => o.id === previous.id);
    if (!option) { delete backups[previous.id]; continue; }
    if (!backup) throw new MedusaError(MedusaError.Types.INVALID_DATA, "La tarification d’origine est indisponible. Vérifiez l’option dans Livraison.");
    updates.push({ id: previous.id, name: backup.name, price_type: "flat", data: backup.data, prices: [{ currency_code: "mad", amount: backup.amount }] }); delete backups[previous.id];
  }
  return new StepResponse({ ...input, storeId: current.id, backups, updates });
});
const save = createStep("amoon-save-store-settings", async (input: { prepared: { settings: StoreSettings; revision: number; storeId: string; backups: Record<string, ShippingBackup> }; updated: unknown }, { container }) => {
  const service: BrandingService = container.resolve(BRANDING_MODULE);
  const p = input.prepared;
  const previous = await readNativeStoreSettings(settingsConnection(container));
  await service.saveNativeStoreSettings(p.storeId, p.settings, p.backups, p.revision);
  return new StepResponse(undefined, { id: p.storeId, name: previous.nativeName, revision: p.revision + 1, metadata: { amoon_store_settings: previous.metadata.amoon_store_settings, amoon_delivery_backups: previous.metadata.amoon_delivery_backups } });
}, async (previous, { container }) => {
  if (!previous) return;
  const service: BrandingService = container.resolve(BRANDING_MODULE);
  await service.restoreNativeStoreSettings(previous.id, previous.name, previous.metadata, previous.revision);
});
export const saveStoreSettingsWorkflow = createWorkflow("amoon-save-store-settings", (input: Input) => {
  acquireLockStep({ key: "amoon-store-settings", timeout: 5, ttl: 60 });
  const prepared = prepare(input);
  const updated = updateShippingOptionsWorkflow.runAsStep({ input: prepared.updates });
  save({ prepared, updated });
  releaseLockStep({ key: "amoon-store-settings" });
  return new WorkflowResponse(undefined);
});
