# Amoon Collection

**New server installation:** follow [the production setup guide](docs/new-server.md).
It includes a separate PostgreSQL 18/Redis/HTTPS Compose stack, secure environment
generation, existing-store transfer, owner invitations and private backups.

Self-hosted French fashion commerce project. **Phases 1–7 implemented:** infrastructure, responsive storefront, editorial homepage, Medusa-connected catalog, actual product pages and persistent Medusa carts with quantity updates, removal and backend totals. Homepage and shop use actual Medusa data only; invented products, prices and imagery are not displayed. Checkout includes Moroccan address validation, real delivery choices, manual cash on delivery and backend order completion with a protected confirmation page. A subsequent read-only audit found order #1 persisted at 150 MAD with free delivery and COD metadata. Browser receipt/recovery and actual fulfillment/cash collection still need verification; setup creates no sample orders or customer details.

## Development

To work without Docker, use the dedicated Windows PostgreSQL instance and compiled local Admin described in [native development](docs/native-development.md). Run `npm run setup:native`, build Medusa, then `npm run dev:native`. Native Admin uses http://localhost:9001/app; the storefront remains on http://localhost:8000. No sample products are seeded.

For automatic local backend/catalog configuration after Docker Desktop is running, use `npm run setup:local`. See [local catalog setup](docs/local-catalog-setup.md).

Node 22.12+ LTS, npm, Docker Compose v2. From this directory:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

Copy root and each application's `.env.example` to `.env` for development and fill required values. Use matching database credentials. Start infrastructure with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis`; application examples use localhost. Run `npm run db:migrate`, then start `npm run dev:medusa` and `npm run dev:storefront` in separate terminals.

## Docker

Copy root `.env.example` to `.env`, supply independent secrets and database password, then:

```sh
docker compose build
docker compose up -d
docker compose ps
```

Storefront: http://localhost:8000. Medusa health: http://localhost:9000/health. Existing Medusa Admin: http://localhost:9000/app. Create the first owner account as documented in `docs/operations.md`. Migrations run before API/worker startup. There are no default admin credentials.

See [architecture](docs/architecture.md), [operations](docs/operations.md), [implementation phases](docs/phases.md) and [Phase 1 verification](docs/phase-1-verification.md).

See [Phase 2 verification](docs/phase-2-verification.md) for the shared storefront components and responsive checks.
See [Phase 3 verification](docs/phase-3-verification.md) for homepage checks and newsletter configuration, and [demo imagery](docs/demo-imagery.md) for generated asset prompts.
See [Phase 4 verification](docs/phase-4-verification.md) and run `npm run test:catalog --workspace @amoon/storefront` for catalog behavior checks.
See [Phase 5 verification](docs/phase-5-verification.md) for product pages and the limits of testing against current owner inventory.
See [Phase 6 verification](docs/phase-6-verification.md) for persistent carts. `prepare:local` generates an independent server-only `CART_COOKIE_SECRET`; catalog setup supplies `MEDUSA_SALES_CHANNEL_ID` alongside the region and publishable key. Keep all these values in ignored environment files.
See [Phase 7 verification](docs/phase-7-verification.md) for checkout and its live-order verification limit. `npm run configure:checkout` configures the owner's free Morocco delivery and manual COD without creating products, stock quantities or orders.
# amoon

Phase 8 adds a read-only `npm run check:operations` report and the [owner Admin guide](docs/owner-admin-guide.md). See [Phase 8 verification](docs/phase-8-verification.md) for operational limits; actual dispatch details, stock review and order processing are still needed.

Phase 9 adds canonical metadata, actual product JSON-LD, sitemap/robots and a denied-by-default analytics integration boundary. WhatsApp remains hidden until the owner supplies a real number. See [Phase 9 verification](docs/phase-9-verification.md).

Phase 10 adds repeatable native QA (`npm run qa:native`) and checkout stage focus handling. See [QA results and remaining release checks](docs/phase-10-verification.md). Production Docker deployment is not run while the owner's no-Docker preference is active.

Phase 11 preparation adds `npm run backup:native -- --verify-restore` and `npm run check:release`. A native database backup/isolated restore has been verified; public hosting, production infrastructure and off-site recovery are still pending. See [deployment preparation](docs/phase-11-verification.md).
