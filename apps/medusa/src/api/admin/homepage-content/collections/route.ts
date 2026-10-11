import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const collections: { id: string; title: string; handle: string }[] = [];
  for (let skip = 0; ; skip += 200) {
    const { data } = await query.graph({ entity: "product_collection", fields: ["id", "title", "handle"], pagination: { take: 200, skip, order: { id: "ASC" } } });
    collections.push(...data);
    if (data.length < 200) break;
  }
  res.setHeader("Cache-Control", "no-store"); res.json({ collections: collections.sort((a,b) => a.title.localeCompare(b.title, "fr")) });
}
