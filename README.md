# Amoon Collection

Self-hosted French fashion commerce project. **Phase 1 foundation only:** this is not yet an operational store. Product UI, checkout and COD will be implemented in subsequent phases. No fake order confirmation or payment gateway exists.

## Development

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
# amoon
