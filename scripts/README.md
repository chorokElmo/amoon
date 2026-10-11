# Scripts and store setup

All Medusa preconfiguration lives in [`apps/medusa/src/scripts/setup-store.ts`](../apps/medusa/src/scripts/setup-store.ts).
It combines Morocco/MAD, the sales channel and publishable key, stock location,
free Morocco delivery, manual cash on delivery, and the fashion taxonomy.
It reuses existing records and creates missing configuration; it does not create
products, inventory quantities, customers, orders, or an admin account.

## Run with Docker

Rebuild the backend image after pulling these changes so the compiled setup file exists.

Windows PowerShell, from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-store-docker.ps1 -Start
```

Linux production, with `.env.production` already configured:

```bash
bash scripts/server.sh build
bash scripts/server.sh start
bash scripts/server.sh setup
```

These launchers execute the same setup inside Medusa, synchronize its connection
values into the Compose environment, and recreate the storefront. No host npm
installation is needed. Run only one setup at a time; if a step fails, correct
the reported issue and rerun. Earlier steps may already have completed.

| Scope | Configuration |
| --- | --- |
| `all` (default) | Everything below |
| `core` | Catalog plus checkout |
| `catalog` | Morocco/MAD, store, channel and publishable key |
| `checkout` | Shipping and COD; requires saved catalog connection values |
| `fashion` | Categories, types, tags and collections |

Examples for an already running backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-store-docker.ps1 -Scope all -Preview
```

```bash
bash scripts/server.sh setup all preview
bash scripts/server.sh setup fashion
```

Preview performs no setup writes. Fashion preview reads existing taxonomy;
core preview describes planned operations rather than checking readiness.

## Host Node and native Windows

With dependencies installed and a local backend environment, `npm run setup:store`
runs migrations and the complete setup. Use `-- --scope core` to omit taxonomy.
`npm run setup:store -- --plan` prints a plan without starting services.
`npm run setup:local` retains the Docker core-only shortcut; restart/recreate the
storefront afterward to load synchronized values.

`npm run setup:pc` provisions the dedicated native Windows PostgreSQL installation,
runs core setup and builds Medusa. `npm run setup:native` omits the build.
Existing `configure:checkout`, Medusa `setup:catalog` and `setup:fashion` npm
commands are retained as aliases to the unified implementation.

## File organization

| Location | Purpose |
| --- | --- |
| `apps/medusa/src/scripts/setup-store.ts` | Single Medusa preconfiguration implementation; compiled into the backend image |
| `scripts/setup-store.mjs` | Node launcher and connection synchronization |
| `scripts/setup-store-docker.ps1`, `scripts/server.sh` | Windows/Linux Docker launchers |
| `scripts/prepare-local.mjs`, `scripts/setup-native.mjs`, `scripts/server-init.sh` | Environment and infrastructure provisioning |
| `scripts/build-medusa.mjs` | Backend/Admin compilation |
| `scripts/dev-native.mjs`, `scripts/invite-native.mjs`, `scripts/backup-native.mjs` | Native runtime, private admin invitations and backups |
| `scripts/check-operations.mjs`, `scripts/qa-native.mjs`, `scripts/server-check.mjs` | Operational, local HTTP and deployment validation |
| `apps/medusa/src/scripts/check-operations.ts`, `apps/medusa/src/scripts/set-product-price.ts` | Backend-only reporting and explicit product price changes |
| `tests/*.test.mjs` | Regression tests, run together with `npm test` |

The old three Medusa setup files were merged into `setup-store.ts`.
The redundant `setup-local.mjs`, `configure-checkout.mjs` and `setup-pc.mjs`
launchers were removed and their npm commands redirected.
The former app-level test scripts and `server-check.test.mjs` now live in `tests/`.
`catalog.test.mjs` tests storefront behavior; it never seeds a store.
The build helper moved from `apps/medusa/scripts/` into this folder.
The duplicate release configuration validator was merged into `server-check.mjs`;
`npm run check:release` still validates root `.env` without making HTTP requests.

Build, backup, diagnostics and tests remain separate because they have different
effects and should not run whenever you configure a store.
