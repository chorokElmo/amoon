# Fashion catalog setup

`apps/medusa/src/scripts/setup-store.ts` (the `fashion` scope) creates the proposed English
taxonomy: Women, Men, Jewelry and Kids with nested categories; clothing,
footwear, bag, accessory and jewelry types; six curated collections; and a
controlled set of tags. Edit the arrays before running if you do not sell all
these departments or want French display names.

Category handles include the full ancestry, for example
`women-clothing-dresses` and `men-shoes-sneakers`. Handles must be unique across
categories, including categories under different parents. These handles do not
create nested storefront routes automatically.

The script reads all pages of existing records. Reruns reuse categories and
collections by handle, and types/tags by case-insensitive value. It preserves
existing names, visibility and product assignments. An existing category with a
different parent stops the script for review; earlier writes may have completed,
so resolve the conflict and rerun. Do not run concurrent copies.

## Docker on this PC

Build the current source into the image first. This command recreates the backend
and worker; the database must be healthy and migrations must succeed.

```powershell
docker compose up -d --build --wait medusa worker
docker compose exec -T -e MEDUSA_WORKER_MODE=shared medusa node node_modules/@medusajs/cli/cli.js exec ./src/scripts/setup-store.js fashion preview
```

After reviewing the preview, create the records:

```powershell
docker compose exec -T -e MEDUSA_WORKER_MODE=shared medusa node node_modules/@medusajs/cli/cli.js exec ./src/scripts/setup-store.js fashion
```

## Docker on the server

Use the same Compose and environment files used to start the server:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build --wait medusa worker
docker compose --env-file .env.production -f docker-compose.production.yml exec -T -e MEDUSA_WORKER_MODE=shared medusa node node_modules/@medusajs/cli/cli.js exec ./src/scripts/setup-store.js fashion preview
```

Remove the final `preview` argument to apply it. If
`migrate` fails, inspect its logs and fix that error before running the taxonomy.
The `fashion` scope runs only taxonomy. The default `all` scope also configures Morocco/MAD, shipping and COD.

## Without Docker

With installed dependencies and the backend environment configured:

```sh
npm run setup:fashion --workspace @amoon/medusa
```

## Organize actual products

The script creates empty categories (active and public), types, tags and
collections. It does not create products or assign existing products to them.
Review the category visibility before launch. Keep existing handles stable;
changing the script's names also changes generated handles on subsequent runs.

For each real product, select appropriate categories, a product type, tags and
one collection. Create size/color options and sellable variants with actual
SKUs, MAD prices and inventory. Publish to Amoon Storefront and assign the
shipping profile. Collection names such as Best Sellers do not calculate sales
rankings; curate membership yourself. Tag filters and nested navigation require
corresponding storefront support.
