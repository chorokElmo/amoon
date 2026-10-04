# Catalog configuration and behavior

Phase 4 reads the Medusa v2 Store API from Server Components. The storefront never imports demo fixtures into the catalog, and it never substitutes a failed request with an empty product list.

## Required setup

1. Start PostgreSQL, Redis and Medusa using the existing operations guide; complete migrations.
2. In Medusa Admin, create/select a sales channel and a publishable API key associated with it. Set `MEDUSA_PUBLISHABLE_KEY` in the storefront environment.
3. Create a region using currency `MAD` that includes country `ma` (Morocco). Set `MEDUSA_REGION_ID` if there is more than one matching region; it can be omitted when exactly one exists.
4. Set `MEDUSA_INTERNAL_URL` to the API URL reachable from the storefront server (`http://medusa:9000` in Compose; `http://localhost:9000` in local development).
5. Publish products and associate them with the key's sales channel. Set MAD variant prices and link stocked inventory locations to that sales channel. Activate public categories; assign category and collection relationships in Admin.
6. Name variant options `Taille`/`Size` and `Couleur`/`Color`/`Colour`. Option values and independent inventories remain normal Medusa variants, never comma-separated product fields.

The setup is documented here; this phase does not create owner accounts, sales channels or production inventory automatically. Restart the storefront after changing environment variables.

## Routes and URL state

- `/boutique`: all channel-visible published products.
- `/nouveautes`: the same catalog, newest first by default.
- `/collections`: public categories and actual Medusa collections.
- `/collections/[handle]`: category or collection selection. A category includes descendant categories. If a category and collection share a handle, the collection link includes `?univers=collection`, preserved through search, sorting and filters.
- Product-detail links and cart actions are reserved for Phases 5–6. Cards currently offer an explicit contact/WhatsApp inquiry rather than a broken detail link.

GET query parameters: `q`, repeated `categorie`, repeated `taille`, repeated `couleur`, `min`, `max`, `disponible=1`, `tri=newest|price_asc|price_desc|popular`, `page`. URLs can be bookmarked. Multiple values within one facet use OR; different facets use AND. Size, color, stock and price must match the **same variant**. Changing filters or sorting resets pagination. Removing a chip preserves the remaining filters. Search supports French accents and casing.

Price filters and displayed minimum prices use Medusa calculated MAD amounts, with tax-inclusive amounts when provided. Medusa v2 amounts are major currency units; there is no division by 100. Missing/foreign-currency prices remain unavailable. Price sorting happens across the complete fetched selection before pagination, with unavailable prices last. A crossed-out original price is shown only when Medusa returns a larger original price for the displayed variant.

`En stock` means inventory is positive or Medusa does not manage inventory. `Sur commande` means a zero/missing-stock variant explicitly permits backorders; it is excluded by `En stock uniquement`. Missing inventory data is never reported as stocked. The Store API computes inventory for the key's sales channels and linked locations. Stock is indicative; final stock validation belongs to checkout.

The `Populaires` choice uses an explicit numeric product metadata field `popularity_rank` (lower first), editable in Medusa Admin. This is an owner-curated order, not invented sales statistics. Unranked products follow newest-first. Without ranks, the UI explains the newest-first fallback. A real order-based ranking can replace this later.

## Photographs

Medusa-uploaded `/static/` images are proxied through `/api/catalog-image`, then optimized with Next Image. The origin is the configured internal backend. Additional object-storage hosts require `PRODUCT_IMAGE_ORIGINS`, a comma-separated list of exact HTTPS origins, for example `https://photos.example.com`. Do not use wildcards. Explicit bundled `/images/` assets are also supported.

The proxy blocks unrelated origins, backend admin paths, credentials, redirects, non-raster content types and responses larger than 8 MiB. It uses an 8-second timeout and accepts PNG/JPEG/WebP/AVIF/GIF. No SVG is proxied. Configure only trusted storage origins. Missing/unapproved photographs show a neutral placeholder, not generated substitutes for real merchandise.

## Bounds and operations

The adapter requests products, categories and collections in 100-item pages, with a 20-second total request deadline and 30-second fetch revalidation. It reads the complete published catalog before applying variant facets and global price sorting. Each list has a 1,000-item safety bound; exceeding it fails visibly instead of truncating results. This suits the initial boutique catalog. For a larger store, move variant/price filtering and sorting into an indexed Medusa search endpoint before lifting that bound.

Validate production tax configuration and compare storefront prices to Admin/checkout before launch. Owner configuration and live database integration remain unverified in this environment. Product metadata requested through Store API is public; never put secrets or customer information there.
