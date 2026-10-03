# Ubuntu operations

## First deployment

Install Docker Engine and Compose v2 on Ubuntu. Use a trusted repository checkout. Set root `.env` permissions to 600. Generate three independent URL-safe secrets with `openssl rand -hex 32` for PostgreSQL, JWT and cookies. Set the actual HTTPS storefront and API origins and matching CORS lists. Admin uses `MEDUSA_BACKEND_URL` at build time; rebuild when it changes.

```sh
npm ci
npm run lint
npm run typecheck
npm run build
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 migrate medusa worker
curl -f http://127.0.0.1:9000/health
curl -f http://127.0.0.1:8000/api/health
```

Create an owner through the official Medusa CLI in the running API container (substitute credentials; avoid shell history for the password):

```sh
docker compose exec medusa npx medusa user -e owner@example.com -p 'YOUR_STRONG_UNIQUE_PASSWORD'
```

Open `/app` on the API origin and set up store, Morocco region/MAD, sales channel and publishable key. Copy the key to root `.env` and recreate storefront. Phase 8 supplies the complete commerce setup; Phase 1 has not configured shipping or COD yet.

## Reverse proxy

Run host Nginx or Caddy with valid HTTPS certificates. Proxy storefront origin to `127.0.0.1:8000` and API/Admin origin to `127.0.0.1:9000`. Forward Host, X-Forwarded-For and X-Forwarded-Proto; configure trusted proxy headers and request limits. Restrict Admin access using a VPN or reverse-proxy access policy where practical; preserve required Store API access. Only expose ports 80/443 and restricted SSH externally. Avoid wildcard CORS. Confirm secure cookies and login through the HTTPS origin before release.

## Updates and migrations

Back up before updates. Build new images, stop API and worker to prevent mixed-schema traffic, then run migrations once:

```sh
docker compose build
docker compose stop storefront medusa worker
docker compose run --rm migrate
docker compose up -d
```

`medusa db:migrate` runs migrations and link synchronization. Do not manually edit Medusa tables. Rollback may require restoring the pre-update backup and previous image; arbitrary down-migrations are not assumed safe.

## Backups and restoration

Run encrypted daily off-server PostgreSQL backups and back up the media volume. Keep `.env` separately in a secret store. On Ubuntu:

```sh
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/amoon-$(date +%F-%H%M).dump"
```

For media, archive `/app/static` from the API container or snapshot the Docker volume. Redis AOF persists queues; capture Redis volume during a maintenance window if full workflow recovery is required. Database and queue backups should be consistent with no active order traffic.

Test restoration into an isolated environment routinely. Restore PostgreSQL into an empty same-version database with `pg_restore --exit-on-error --no-owner`, restore media, start matching application images, then validate inventory/orders and Admin. Never restore over an active production database without a planned maintenance procedure. `docker compose down` preserves volumes; `down -v` deletes them.

## Release gate

Verify migrations, Admin login, uploaded image persistence, region/key configuration, inventory reservations, real cart completion, COD cash collection workflow, duplicate/retried checkout and restore. A successful build or health endpoint does not establish these behaviors. Fashion assets, delivery fees and legal terms also require approval before launch.
