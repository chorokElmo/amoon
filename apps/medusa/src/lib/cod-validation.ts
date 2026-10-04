const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
function numeric(value: unknown): number | null {
  const v = record(value);
  // Workflow totals can be Medusa BigNumber instances; HTTP JSON serializes them to numbers.
  const n = typeof value === "number" ? value : typeof v.numeric === "number" ? v.numeric : v.raw_ && typeof v.numeric_ === "number" ? v.numeric_ : null;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}
export function codIssue(input: unknown): string | null {
  const c = record(input); const collection = record(c.payment_collection);
  const sessions = Array.isArray(collection.payment_sessions) ? collection.payment_sessions.map(record).filter(s => s.provider_id === "pp_system_default" && ["pending", "authorized"].includes(String(s.status))) : [];
  if (!sessions.length) return null;
  const total = numeric(c.total);
  if (total === null || numeric(collection.amount) !== total || sessions.some(s => numeric(s.amount) !== total || s.currency_code !== "mad")) return "Payment amount changed; review checkout again.";
  const a = record(c.shipping_address); const phone = String(a.phone || "").replace(/[\s().-]/g, "").replace(/^00212/, "+212");
  if (!c.email || a.country_code !== "ma" || !a.first_name || !a.last_name || !a.address_1 || !a.city || !/^(?:0|\+212)[567]\d{8}$/.test(phone) || !Array.isArray(c.shipping_methods) || !c.shipping_methods.length) return "Morocco COD requires complete delivery details and a delivery method.";
  return null;
}
