# Couleurs & Thème

The native Medusa dashboard now has **Apparence du site**, with **Couleurs & Thème** at `http://localhost:9001/app/appearance/colors`. Sign in using the existing store admin account. The page controls nine colors, provides a live illustrative header/hero/buttons/product-card/footer preview, and offers **Rose élégant**, **Noir & Or** and **Beige minimaliste** presets. The preview clearly labels its products as examples; no catalog records are created or changed.

## Drafts, publishing and defaults

- **Enregistrer le brouillon** stores the current palette for the next editing session. It does not change published colors.
- **Publier le thème** atomically saves and publishes the current palette. Public pages read only the published palette without persistent caching. Reload an already-open storefront tab to receive it.
- Draft saves require valid six-digit HEX colors (`#RRGGBB`). Drafts may contain contrast problems while the owner experiments; the UI explains each problem and blocks publishing until corrected.
- Publishing requires WCAG AA normal-text contrast of at least 4.5:1 for main text on page, header, footer and secondary backgrounds, and for primary-button text against its background. Every preset passes these checks. Pale brand/accent colors remain usable for decoration; foregrounds for text links, badges and the announcement are derived automatically where needed.
- **Réinitialiser par défaut** opens a French confirmation modal. Confirming clears the draft and published override and immediately restores the original Amoon colors. Cancelling makes no changes.
- Browser reload/close receives the browser’s native unsaved-changes warning. In-app navigation receives the French Medusa confirmation modal, with options to remain or discard the unsaved changes.
- Preset selection and color edits update only the preview until published. Draft and published revisions are separate. Stale or concurrent editors receive HTTP 409 rather than overwriting each other.
- With no published theme, an unavailable/older backend, an invalid palette, or the exact original palette, no theme overrides are emitted. Original Amoon CSS and responsive geometry are preserved. A fallback comparison confirmed every original hero declaration after removing only the new color tokens.

## Architecture, security and scope

The existing branding module was extended with one theme-settings model. Existing branding/image storage, slider records, products, orders and checkout logic are preserved. Admin endpoints use the existing Medusa `user` session/bearer authentication. The public Store API never exposes draft colors. Strict payload schemas reject unknown keys, invalid actions, invalid revisions and anything other than six-digit HEX values. The storefront independently validates public values before emitting CSS custom properties, preventing CSS/style injection and rejecting inaccessible palettes.

The common root layout loads the published theme server-side and applies CSS variables on `<html>`. Homepage, shop, product details, cart and checkout inherit the same palette. Scoped overrides connect the existing CSS/Tailwind variables and the previously fixed hero/card colors. Dimensions, typography, spacing, images and interactions are unchanged. Uploaded logos are not recolored. Product color swatches, image overlays and the WhatsApp service color retain their existing meaning. The contrast checker covers the configurable text/background combinations; it is not a replacement for a full accessibility audit of photographs or third-party brand images.

No dependencies were added. The existing backend/admin assets were compiled to install the new routes; the project was not recreated. No commit or push was made. This work is active locally; it was not deployed to `amoon.ma`.

## Migration and activation

`apps/medusa/src/modules/branding/migrations/Migration20261011170635.ts` adds only `amoon_theme_settings` and its soft-delete index. The row contains draft/published JSON palettes and separate editing/publication revisions. The branding module’s generated `.snapshot-branding.json` now includes the added table. Existing branding and slider tables are unchanged.

The migration was applied locally to the existing `amoon` database on port 5434 and to the dedicated isolated test database. A private database/media backup was made first. Existing branding and slider JSON/revisions were captured before the migration and compared afterwards, along with counts of 2 products, 3 orders, 1 user and 1 auth identity. No palette was published into the real local store during testing.

For another existing installation, preserve its private connection settings and run:

```powershell
$env:MEDUSA_LOCAL_INFRASTRUCTURE = "true"
$env:MEDUSA_WORKER_MODE = "shared"
npm run db:migrate
npm run build --workspace @amoon/medusa
npm run dev:native
```

In a second terminal, run `npm run dev:storefront`. Restarting the local in-memory backend clears active admin sessions, so sign in again using the existing account.

## Manual checklist

1. Open **Apparence du site → Couleurs & Thème**. Try all three presets and change a color using both its picker and HEX field. Confirm the preview updates immediately.
2. Save a draft. Reload the editor and verify it remains saved; reload the public homepage and verify its published colors have not changed.
3. Publish an accessible palette. Reload homepage, shop, an actual product reached from the shop, cart and checkout. Check header/footer, text, buttons and card surfaces at desktop and mobile widths. Confirm the existing logos and slider are intact.
4. Enter invalid HEX text or make main text match a background. Confirm the warning and disabled publication action. A low-contrast but syntactically valid draft can still be saved.
5. Change a color and navigate away without saving. Confirm the French warning; cancel it and continue editing. Open reset, cancel, then confirm it and verify the original colors return on the public site.
6. Reload/restart and verify persistence. Open two editors to check stale-save protection. Sign out and confirm admin theme endpoints deny access.

## Automated verification

```powershell
npm run test:theme
npm run test:branding
npm run test:slider
npm run test:catalog --workspace @amoon/storefront
npm run lint
npm run typecheck
```

The API integration suite uses `THEME_TEST_DATABASE_URL`, `THEME_TEST_BACKEND_URL`, `THEME_TEST_ADMIN_EMAIL` and `THEME_TEST_ADMIN_PASSWORD`, then `npm run test:theme:integration`. It requires a migrated local `*_theme_test`, `*_branding_test` or `*_slider_test` database with no existing theme settings. It refuses remote hosts and the main backend ports. It writes test palettes and a publishable API key only in the isolated test store.

- 8 theme tests, 8 branding tests, 10 slider tests and 55 existing catalog tests passed.
- The isolated authenticated API suite passed: unauthorized access, draft privacy, invalid HEX, contrast enforcement, publication, stale and concurrent saves, reset, database persistence and unchanged branding/slider rows.
- Workspace lint and TypeScript checks, direct ESLint checks for the new test scripts, backend/admin compilation and default hero fallback comparison passed.
- The published test palette was verified in the shared HTML variables on homepage, shop, product route, cart and checkout. The isolated catalog is empty, so the product-route check covers its themed unavailable state; existing product/checkout logic is covered by the catalog regression suite.
- Draft, published palette and revisions survived an actual isolated backend restart.
- Browser checks passed for all nine color inputs, immediate preview/picker synchronization after HEX edits, preset selection, contrast warnings and disabled publishing, draft save without changing the published palette, publishing, the unsaved-navigation modal and both cancellation/confirmation of reset. The editor had no horizontal overflow at its observed 408-pixel viewport. A browser-confirmed reset removed public CSS overrides. The real store retained its original colors and existing settings throughout testing.
- The initial API suite ran before the test backend had finished starting and received connection refused; rerunning after readiness passed. A trailing blank line introduced while editing the hero CSS was removed. The isolated admin shell needed a backend restart after new compiled route assets were copied into it.

## All modified and added files

| File | Purpose |
| --- | --- |
| `apps/medusa/src/admin/routes/appearance/page.tsx` | Apparence du site entry and theme link. |
| `apps/medusa/src/admin/routes/appearance/colors/page.tsx` | French editor, pickers, presets, live preview and native confirmation dialogs. |
| `apps/medusa/src/api/admin/theme/route.ts` | Read/save draft, publish and reset endpoints. |
| `apps/medusa/src/api/store/theme/route.ts` | Published-only public theme endpoint. |
| `apps/medusa/src/api/middlewares.ts` | Authentication, strict schema and body limits. |
| `apps/medusa/src/lib/theme-palette.ts` | Original palette, presets, labels and contrast utilities. |
| `apps/medusa/src/lib/theme-validation.ts` | HEX/action validation and publication contrast gate. |
| `apps/medusa/src/modules/branding/models/theme-settings.ts` | Persistent theme model in the existing settings module. |
| `apps/medusa/src/modules/branding/service.ts` | Atomic draft/publication/reset operations and conflict checks. |
| `apps/medusa/src/modules/branding/migrations/Migration20261011170635.ts` | Add the theme-settings table only. |
| `apps/medusa/src/modules/branding/migrations/.snapshot-branding.json` | Updated generated module snapshot. |
| `apps/storefront/src/lib/theme.ts` | Defensive public reader, safe variable mapping and derived readable colors. |
| `apps/storefront/src/lib/store-theme.ts` | Server-only published-theme loader. |
| `apps/storefront/src/app/layout.tsx` | Load and apply theme globally. |
| `apps/storefront/src/app/theme.css` | Color-only overrides, scoped to published custom themes. |
| `apps/storefront/src/components/storefront/homepage-hero.module.css` | Color tokens with exact original fallback values. |
| `scripts/test-theme.mjs` | Palette, accessibility, injection and frontend tests. |
| `scripts/test-theme-integration.mjs` | Isolated API/database/concurrency test. |
| `package.json` | Theme test commands. |
| `docs/theme-management.md` | Migration, behavior, complete file list and test checklist. |

Ignored `.local` files contain the private backup, test runners and snapshots. They are not application source changes.
