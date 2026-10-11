# Logo & Identité visuelle

The native Medusa Admin editor is available at `http://localhost:9001/app/branding`. Use the existing store admin login. The feature uses the same authenticated session/bearer middleware, PostgreSQL database, Medusa file provider, French Medusa UI, pre-save previews and revision checks as the slider. No dependencies were added, and no commits or pushes were made.

## Behavior and validation

- Header logo, footer logo and favicon are independent. Select files, review the previews, then click **Enregistrer**. Changes are published together after uploads succeed. Successfully uploaded drafts remain available if a later upload or configuration save fails.
- Logos: PNG, JPG, WebP or simple vector SVG, maximum 5 MiB, 4096 × 4096 pixels and 16 megapixels. Animated files are rejected. Files are decoded and converted to metadata-free PNG through the existing Sharp dependency.
- SVG: a restricted XML grammar is reconstructed before decoding. Only basic shapes, paths, groups and gradients with permitted attributes are supported. Scripts, events, CSS/styles, text, entities/DOCTYPE, embedded images/HTML, links and external resources are rejected. The original SVG is never rendered by the browser or stored publicly. Click **Valider et prévisualiser le SVG** to obtain a safe PNG preview before saving. Complex SVG artwork should be exported to PNG.
- Favicons: PNG or ICO, maximum 1 MiB. PNG must be square, 16–512 pixels. ICO supports PNG frames and uncompressed 24/32-bit bitmap frames, up to 20 frames; all frames are validated and the largest becomes a PNG favicon. Indexed/paletted ICO variants must be exported to PNG.
- The backend accepts validated image IDs for the correct slot, never client-supplied image URLs. The public API omits storage IDs. Management endpoints require an authenticated Medusa admin user.
- **Utiliser l’image par défaut** stages restoration for one asset until the next save. **Restaurer les valeurs par défaut** restores all three assets only after **Confirmer la restauration**; **Annuler** leaves the saved assets untouched.
- Replaced uploads remain in storage, so restoration or replacements do not delete media used elsewhere. A failed save or abandoned SVG preview can leave an unattached upload; no automatic deletion is performed.
- Header/footer keep existing responsive display sizes and `object-fit: contain`. Uploaded logos retain their colors; only the original logo keeps the existing burgundy filter.
- Public pages fetch branding without a persistent cache, using the existing publishable API key and media proxy. Reload a public page after saving to see the logos and favicon. Unique generated upload filenames prevent reuse of an old cached image. An already-open tab needs a reload; browsers can retain favicon displays until a new navigation.
- Original logo and favicon remain defaults when no custom assets are saved or the backend is unavailable. The original app icon moved to `public/images/favicon-default.svg`, allowing dynamic metadata to select the saved favicon without a competing fixed Next.js icon convention.

## Migration and local activation

`apps/medusa/src/modules/branding/migrations/Migration20261011160357.ts` adds only `amoon_branding_config` and `amoon_branding_image` with their indexes. The generated `.snapshot-branding.json` accompanies it. No slider tables, product/order data or credentials are changed by this migration.

The migration has been applied to the existing local `amoon` database on port 5434 and to the isolated test database. The current checkout serves the updated backend/admin on port 9001 and storefront on port 8000. A private database/media backup was created before applying the migration. Verification compared the saved slider JSON/revision and counts of 2 products, 3 orders and 1 user with their pre-migration snapshot.

For another existing installation, retain its private environment settings and run:

```powershell
$env:MEDUSA_LOCAL_INFRASTRUCTURE = "true"
$env:MEDUSA_WORKER_MODE = "shared"
npm run db:migrate
npm run build --workspace @amoon/medusa
npm run dev:native
```

Compile the existing backend/admin assets to activate the additional route; the project architecture is unchanged. In a second terminal, run `npm run dev:storefront`. Restarting the local in-memory backend clears active admin sessions; sign in again with the existing account.

## Test locally

1. Sign into `http://localhost:9001/app/branding`. Confirm all three original asset previews are shown.
2. Select a transparent PNG logo for the header, a JPG/WebP or simple SVG for the footer, and a square PNG/ICO favicon. Confirm previews appear before saving. For SVG, validate the safe preview first.
3. Click **Enregistrer**, then reload `http://localhost:8000/` and another public page. Confirm the distinct header/footer images, original spacing, preserved colors and browser favicon. Check a narrow mobile viewport as well.
4. Reload the editor and restart the backend. Saved assets and images should remain available.
5. Try a malformed/disguised file, an SVG script or external reference, an oversized logo, a non-square favicon and an unsupported favicon type. Confirm French validation errors and that published branding is unchanged.
6. Open **Restaurer les valeurs par défaut**, cancel and verify nothing changed. Open it again and confirm, then reload the storefront. The original branding should return.
7. Verify **Bannières / Slider** still loads and its saved slides appear on the homepage. Sign out and verify branding management endpoints return 401.

Automated checks:

```powershell
npm run test:branding
npm run test:slider
npm run test:catalog --workspace @amoon/storefront
npm run lint
npm run typecheck
```

The integration suite uses `BRANDING_TEST_DATABASE_URL`, `BRANDING_TEST_BACKEND_URL`, `BRANDING_TEST_ADMIN_EMAIL` and `BRANDING_TEST_ADMIN_PASSWORD`, then `npm run test:branding:integration`. It refuses ordinary store database names, remote hosts and the main backend ports. Use a migrated, dedicated local `*_branding_test` or `*_slider_test` database with no branding configuration. It writes test uploads, configuration and a publishable API key only in that isolated instance.

## Verification

- 8 branding tests, 10 slider tests and 55 existing catalog tests passed.
- The isolated authenticated branding API integration test passed, including upload/replacement, unsafe SVG rejection, slot validation, unauthorized requests, public responses, direct database persistence, stale revision conflicts and restoration. Existing slider rows remained unchanged.
- Workspace lint, TypeScript checks, direct ESLint checks for both new test scripts and the backend/admin compilation passed.
- Browser testing confirmed PNG and ICO pre-save previews, SVG conversion and safe preview, successful saving, loaded stored images, the restoration confirmation and cancellation. At the observed 408-pixel admin width, scroll width equaled client width.
- The live public branding and slider APIs, media defaults and homepage returned successfully; original store branding and slider records were preserved.
- Saved header/footer logos and favicon metadata were verified in the isolated public HTML, and all three images returned PNG responses through the existing media proxy. Saved asset IDs, revision and image files survived an actual isolated backend restart.
- The copied public preview initially stalled during CSS compilation. Restricting Tailwind’s source scanning inside that ignored test copy allowed the check to complete; the live application stylesheet was not changed. Initial isolated server startup also encountered sandbox ancestor-metadata restrictions; explicit TypeScript configuration and running the test server with approved local access resolved the restart verification.
- Initial TypeScript Buffer inference errors were corrected. One animation test initially used identical frames that encoded as a still image; the fixture was corrected and the animation rejection test passed.

## All modified, added and removed files

| File | Change |
| --- | --- |
| `apps/medusa/medusa-config.ts` | Register branding module alongside the slider. |
| `apps/medusa/src/api/middlewares.ts` | Branding authentication, schema validation and request limits. |
| `apps/medusa/src/admin/routes/branding/page.tsx` | French editor, previews, save notices and restore confirmation. |
| `apps/medusa/src/api/admin/branding/route.ts` | Read and atomically save validated asset IDs. |
| `apps/medusa/src/api/admin/branding/images/route.ts` | Validate/store image uploads. |
| `apps/medusa/src/api/store/branding/route.ts` | Public saved branding response. |
| `apps/medusa/src/lib/branding-validation.ts` | Payload schemas and limits. |
| `apps/medusa/src/lib/branding-images.ts` | Raster decoding, restricted SVG sanitization and ICO decoding. |
| `apps/medusa/src/lib/branding-response.ts` | Resolve stored asset IDs to public image metadata. |
| `apps/medusa/src/modules/branding/index.ts` | Custom module entry. |
| `apps/medusa/src/modules/branding/service.ts` | Persistent configuration and revision conflict checks. |
| `apps/medusa/src/modules/branding/models/branding-config.ts` | Branding configuration model. |
| `apps/medusa/src/modules/branding/models/branding-image.ts` | Validated image/storage model. |
| `apps/medusa/src/modules/branding/migrations/Migration20261011160357.ts` | Add two branding tables. |
| `apps/medusa/src/modules/branding/migrations/.snapshot-branding.json` | Generated module schema snapshot. |
| `apps/storefront/src/lib/branding.ts` | Public API reader and defensive response validation. |
| `apps/storefront/src/lib/store-branding.ts` | Per-render server reader and existing media proxy resolution. |
| `apps/storefront/src/app/layout.tsx` | Pass independent logos and generate favicon metadata. |
| `apps/storefront/src/components/storefront/header.tsx` | Accept configured header logo. |
| `apps/storefront/src/components/storefront/footer.tsx` | Accept configured footer logo. |
| `apps/storefront/src/components/storefront/wordmark.tsx` | Dynamic source/dimensions with existing display geometry. |
| `apps/storefront/src/app/reference.css` | Preserve uploaded colors and default logo tint. |
| `apps/storefront/src/app/icon.svg` | Removed fixed icon convention; original artwork retained below. |
| `apps/storefront/public/images/favicon-default.svg` | Original default favicon artwork. |
| `scripts/test-branding.mjs` | Validation/security/format/storefront tests. |
| `scripts/test-branding-integration.mjs` | Isolated authenticated API/database regression test. |
| `package.json` | Branding test commands. |
| `docs/branding-management.md` | Behavior, migration, checks and complete file list. |

Ignored `.local` files contain test infrastructure, fixtures, private snapshots and backups; these are not application source changes.
