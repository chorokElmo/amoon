import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { defaultStoreSettings, type StoreSettings } from "./store-settings";
import { StoreSettingsSchema } from "./store-settings-validation";
type StoreRow = { id: string; name: string; metadata: Record<string, unknown> | null };
export type SettingsConnection = { raw: (sql: string, values?: unknown[]) => Promise<{ rows: StoreRow[] }> };
export function settingsConnection(scope: { resolve: (key: string) => unknown }) { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as SettingsConnection; }
export async function readNativeStoreSettings(connection: SettingsConnection) {
  const { rows } = await connection.raw("SELECT id, name, metadata FROM store WHERE deleted_at IS NULL ORDER BY created_at LIMIT 2");
  if (rows.length !== 1) throw Error("Une boutique unique est nécessaire pour gérer les paramètres.");
  const row = rows[0], metadata = row.metadata || {};
  const saved = metadata.amoon_store_settings as { settings?: unknown; revision?: number } | undefined;
  let settings: StoreSettings;
  if (saved) {
    const input = saved.settings as Partial<StoreSettings>;
    settings = StoreSettingsSchema.parse({ ...input, info: { ...(input?.info || {}), name: row.name } });
    if (!Number.isInteger(saved.revision) || (saved.revision || 0) < 1) throw Error("Paramètres enregistrés invalides.");
  } else settings = defaultStoreSettings(row.name === "Medusa Store" ? "Amoon Collection" : row.name, process.env.WHATSAPP_NUMBER || "212600940327");
  return { id: row.id, nativeName: row.name, settings, revision: saved?.revision || 0, metadata };
}
