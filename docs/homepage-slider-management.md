# Homepage slider management

The existing Medusa Admin has a **Bannières / Slider** item at `/app/homepage-slider`. The editor supports image uploads/replacements, image previews before saving, titles, descriptions, primary/secondary button text and links, adding/deleting slides, ordering with the arrow buttons, and enable/disable controls. All edits publish together when **Enregistrer** is pressed. Maximum: 12 slides.

## Data and access

- A custom `homepageSlider` Medusa module stores the ordered slide list in `amoon_slider_config` and validated image references in `amoon_slider_image`, in the existing PostgreSQL database.
- The migration only adds these two tables and their indexes. It does not seed slides or change products, orders, customers, or accounts.
- All management and upload endpoints require Medusa `user` authentication using the existing session or bearer mechanism. The public Store API returns only enabled slides in their saved order; it does not expose internal image IDs or disabled slide content.
- JPEG, PNG, and WebP uploads are limited to 10 MiB, 6000 × 6000 pixels, and 25 megapixels. Animated images, invalid base64, corrupt files, and disguised formats are rejected. Sharp, already present through Next.js, is declared as a direct backend dependency at the existing locked version. Files are decoded, re-encoded, stripped of metadata, and saved through the existing Medusa file provider.
- Image URLs submitted by the browser are resolved from validated image records; arbitrary remote image URLs cannot be attached to a slide. Existing default rack images remain available without an upload.
- Button links must be an internal `/path` or an HTTPS URL without credentials. JavaScript URLs, protocol-relative URLs, control characters, and backslashes are rejected.
- Saves use an atomic revision check. A stale editor receives HTTP 409 rather than overwriting another admin's changes.
- The homepage reads the Store API without caching. Refreshing or visiting the homepage displays the latest saved configuration. With no saved configuration, the current three-view hero is preserved. A saved empty list, or disabling all slides, hides the hero. An unavailable or older backend falls back to the existing hero.
- Removing a slide does not remove uploaded media, which avoids breaking other slides or shared files. Unsaved uploaded files can be retained by the provider after a failed save; they are never attached to published slides without a successful configuration save.
- The existing image proxy and configured media origins are reused. If the public file-provider origin differs from `MEDUSA_INTERNAL_URL`, retain its existing `PRODUCT_IMAGE_ORIGINS`/legacy origin configuration.

## Test locally with your existing store

Use the existing private database, authentication, and storefront connection values in this checkout's ignored environment files. Do not run fresh-store setup or seed a new catalog to enable this feature. Stop the older backend on port 9001 before starting this checkout's backend.

From the project root in PowerShell:

```powershell
$env:MEDUSA_LOCAL_INFRASTRUCTURE = "true"
$env:MEDUSA_WORKER_MODE = "shared"
npm run db:migrate
npm run build --workspace @amoon/medusa
npm run dev:native
```

In a second terminal:

```powershell
npm run dev:storefront
```

1. Sign into the existing Admin at `http://localhost:9001/app` and open **Bannières / Slider**.
2. Select a JPEG, PNG, or WebP. Check that its preview changes before saving, then edit the title, description, and button link.
3. Add a second slide. Use ↑/↓ to change its order, disable a slide, and save.
4. Refresh `http://localhost:8000/`. Verify the saved image/text, slide order, button destination, and enabled slides. Use arrows, keyboard left/right, or swipe on mobile to switch slides.
5. Reload the editor and restart the backend to verify persistence. Delete a slide and save; then verify it no longer appears. Disabling all slides should hide the hero.
6. Confirm that an oversized image or SVG upload fails, unsafe button URLs fail, and a signed-out browser cannot use the management API.

## Verification in this session

An isolated PostgreSQL cluster on port 5435 and a separate `amoon_slider_test_20261011` database were used. The test backend is on port 9012 and the test storefront is on port 8012. The existing running checkout on ports 8000/9001 was left unchanged. Test credentials and generated media are in ignored `.local` files; no production or existing store data was copied into the test database.

- `npm run test:slider`: 10 tests passed.
- `npm run test:catalog --workspace @amoon/storefront`: all 55 existing tests passed.
- `npm run test:slider:integration`: the authenticated API/database suite passed against the isolated instance, covering unauthorized access, upload validation, stored images, unsafe URLs, order, visibility, deletion, conflicts, and PostgreSQL persistence.
- Workspace lint and TypeScript checks passed.
- Medusa backend/Admin and storefront production builds passed.
- Browser checks verified the sidebar page, session authentication, pre-save image preview after editing text, upload/replace/save, adding and reordering a disabled slide, and the saved homepage title/image.
- The saved homepage was checked at 1280px and 390px browser widths; the mobile page had no horizontal overflow.
- After restarting the isolated backend, saved slide text, order, enabled flags, and the uploaded image remained available.
- The existing store still had 2 products, 3 orders, 1 user, and 1 auth identity, matching the initial read-only inspection; its database received no slider tables or test records.
- Initial lint errors in new files were corrected. The first TypeScript run failed because Medusa's generated types were missing; regenerating types in the build resolved it. No unrelated source changes were needed.

Run the repeatable unit/regression checks with:

```powershell
npm run test:slider
npm run test:catalog --workspace @amoon/storefront
npm run lint
npm run typecheck
```

The integration script requires a dedicated local test backend with a migrated, empty `*_slider_test` database and one test admin account. Set `SLIDER_TEST_DATABASE_URL`, `SLIDER_TEST_BACKEND_URL`, `SLIDER_TEST_ADMIN_EMAIL`, and `SLIDER_TEST_ADMIN_PASSWORD`, then run `npm run test:slider:integration`. It refuses normal store database names, remote hosts, and the main store ports; it also refuses an existing slider configuration. It creates test image/banner records and a publishable key only in the dedicated test database.

## All changed and added files

| File | Purpose |
| --- | --- |
| `apps/medusa/medusa-config.ts` | Register the module and use the configured native backend origin for file URLs. |
| `apps/medusa/package.json` | Declare the existing Sharp decoder as a backend dependency. |
| `apps/medusa/src/admin/routes/homepage-slider/page.tsx` | Native admin editor and pre-save previews. |
| `apps/medusa/src/api/middlewares.ts` | Admin authentication, body limits, and validation. |
| `apps/medusa/src/api/admin/homepage-slider/route.ts` | Read/save configuration and validated image resolution. |
| `apps/medusa/src/api/admin/homepage-slider/images/route.ts` | Validated uploads using the existing file provider. |
| `apps/medusa/src/api/store/homepage-slider/route.ts` | Read enabled slides for the homepage. |
| `apps/medusa/src/lib/slider-validation.ts` | Slide/link/payload schemas and limits. |
| `apps/medusa/src/lib/slider-images.ts` | Actual image decoding and re-encoding. |
| `apps/medusa/src/modules/homepage-slider/index.ts` | Custom module registration. |
| `apps/medusa/src/modules/homepage-slider/service.ts` | Persistence service and atomic revision checks. |
| `apps/medusa/src/modules/homepage-slider/models/slider-config.ts` | Configuration model. |
| `apps/medusa/src/modules/homepage-slider/models/slider-image.ts` | Validated image model. |
| `apps/medusa/src/modules/homepage-slider/migrations/Migration20261011150104.ts` | Generated additive schema migration. |
| `apps/medusa/src/modules/homepage-slider/migrations/.snapshot-homepage-slider.json` | Generated schema snapshot for future module migrations. |
| `apps/storefront/src/lib/homepage-slider.ts` | Store API reader, response validation, and existing fallback. |
| `apps/storefront/src/components/storefront/homepage-hero.tsx` | Server-side saved-slide loading. |
| `apps/storefront/src/components/storefront/hero-slider.tsx` | Render configurable slides with existing navigation/swipe. |
| `apps/storefront/src/components/storefront/homepage-hero.module.css` | Long-text and variable-count responsive support. |
| `scripts/test-slider.mjs` | 10 validation, image, and storefront tests. |
| `scripts/test-slider-integration.mjs` | Isolated authenticated API/database test. |
| `package.json` | Test commands. |
| `package-lock.json` | Existing Sharp dependency metadata. |
| `docs/homepage-slider-management.md` | Local test instructions, verification, and complete file list. |

No commit or push was made.

## Activated on the existing local website

The updated checkout is now serving `http://localhost:8000/` and `http://localhost:9001/app/homepage-slider`, using the original local `amoon` database on port 5434. Existing private environment settings and uploaded media were copied into this checkout. The previous services and isolated preview services were stopped. The slider migration completed successfully, and products/orders remained at 2/3. A private database/media backup was saved under `.local/backups/2026-10-11T15-33-02-996Z-dc699161` before migration. Existing admin credentials were preserved; the temporary test login is not used by the existing store. Test banners were not published into the existing database.

For subsequent starts in this checkout, use `npm run dev:native` and, in a second terminal, `npm run dev:storefront`. Sign into the existing admin, open **Bannières / Slider**, make your changes and press **Enregistrer**, then refresh the homepage on port 8000.
