# Local catalog setup

Prepared local environment files with independent random database/JWT/cookie secrets. They are ignored by Git and Docker builds. Existing non-empty values are preserved by `npm run prepare:local`. Development PostgreSQL uses port 5433 so the existing Windows PostgreSQL service on 5432 is untouched.

## Run

### Applications running on the host

For the localhost URLs in the application `.env` files, install dependencies with
`npm ci` and start PostgreSQL and Redis. If using the supplied Docker development
infrastructure, run:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
npm run setup:store
```

`setup:store` uses `apps/medusa/.env` and runs migrations, creates/reuses the
Morocco region with MAD and the Amoon Storefront channel/key, configures the
Amoon Collection stock location and its channel/provider links, creates the
Morocco shipping zone and free delivery option (0 MAD), and enables manual cash
on delivery. It then fills the root and storefront `.env` connection values.
It targets a local database only. You do not need to import `db.sql` first.
Preview these steps without changing anything with `npm run setup:store -- --plan`.

Start `npm run dev:medusa` and `npm run dev:storefront` in separate terminals
(or restart them if already running). For an existing native setup on port 9001,
use `npm run dev:native` instead of `dev:medusa`; for a fresh native installation,
follow `new-pc.md` and use `npm run setup:pc`.

Configuration alone does not populate the shop. Create your admin account and
enter your real dispatch address, published products, MAD prices, default
shipping profile and inventory at Amoon Collection. Assign products to Amoon
Storefront. Existing resource conflicts stop setup for review; rerunning reuses
matching resources. Setup does not create sample orders or stock quantities.

### Applications running in Docker

For containers that are already running on Windows, use this from the project
root in PowerShell. Node/npm and dependencies are used inside Medusa's container:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-store-docker.ps1
```

For a first run or stopped Medusa service, add `-Start` to build/start the backend
and its dependencies before setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-store-docker.ps1 -Start
```

If startup fails, inspect `docker compose logs --tail 80 migrate medusa`.
The local Compose database URL disables SSL explicitly because the bundled
PostgreSQL service uses an internal Docker connection without TLS.

If another app uses port 8000, set `STOREFRONT_PORT=8001` in the root `.env`,
set `STOREFRONT_URL=http://localhost:8001`, and use that origin in `STORE_CORS`
and `AUTH_CORS` (keep the Admin origin in `AUTH_CORS` too). Run
`docker compose up -d` to apply the new settings. The storefront's internal
container port remains 8000. On this PC, port 8000 belongs to SplitEasy, so
Amoon uses http://localhost:8001.

Admin session cookies permit HTTP only when `MEDUSA_BACKEND_URL` is an HTTP
loopback URL (`localhost`, `127.0.0.1` or `[::1]`). Public server URLs retain
Secure cookies and need HTTPS. This prevents a successful local login from
immediately returning to the login page because no session cookie was issued.

This configures catalog and checkout in the existing `medusa` service, copies the
generated key/region/channel to the root `.env` and existing storefront `.env`,
then recreates only `storefront` so Compose loads the updated environment. The
container uses `http://medusa:9000` internally; editing the application `.env`
alone does not change its environment. A plain container restart is insufficient.
The database must already be migrated, as it is when the normal Compose stack
starts successfully. The running image must contain the catalog and checkout
scripts. Use `-Plan` to preview without changes. If you started your stack with a
different Compose/env file, supply the same files using `-ComposeFile` and
`-EnvFile`.

For a new Docker stack:

Open Docker Desktop under your Windows account and wait for **Engine running**. From the project directory in CMD:

```cmd
npm run setup:local
```

This command builds the Medusa image, starts the dedicated Compose database/Redis/API/worker services, runs migrations through the existing migrate service, creates/reuses the Amoon Storefront sales channel, creates/reuses a publishable API key, creates/reuses the Morocco region in MAD, configures store defaults, stock location, free Morocco delivery and manual cash on delivery, and writes the verified connection values to the root and storefront `.env` files. It does not start another storefront on port 8000, create sample merchandise, or modify the existing Windows PostgreSQL service.

The backend script uses Medusa workflows and refuses to move Morocco from another region or choose between duplicate Amoon resources. It only creates publishable keys, never secret Admin keys. It preserves other supported currencies. The generated result file `.catalog-setup.json` is ignored and is outside the served media directory.

After success, restart your existing `npm run dev:storefront` process to load the connection. Open `http://localhost:9000/app` for Medusa Admin. Owner account creation and product/stock configuration remain separate steps; no account password is invented. Publish products to the Amoon Storefront channel and link inventory locations as described in `catalog.md`.

## Current verification

On 2026-10-10 the Docker images built successfully, migrations completed, and
Medusa, PostgreSQL, Redis and the storefront reported healthy. The worker was
running. The Docker store setup completed twice, reusing the existing resources.
Storefront home, shop and health endpoints returned HTTP 200 on port 8001; Medusa
Admin and health returned HTTP 200 on port 9000. The Store API accepted the real
publishable key and returned the configured Morocco/MAD region. Read-only checks
confirmed the channel, stock-location links and manual payment provider.

An admin invitation was saved privately; account activation, a dispatch address,
real published products, prices and stock still require owner input. The database
contained zero products and orders. No end-to-end purchase was tested.

## Later deployment to a server

Git transfers code, not the private `.env`, database or uploaded media. A fresh
server needs its own secrets and public URLs, then the catalog/checkout setup.
`docker compose up -d --build` alone starts the default localhost stack; it does
not populate the storefront connection values in a new environment.

For the current `docker-compose.production.yml`, configure its host volume paths
and external `proxy` network for your server's reverse proxy. That file uses
PostgreSQL 16 and exposes the apps through the external proxy network; configure
HTTPS routing for your storefront and API domains in that proxy. Generate the
private production environment, then start and initialize it:

```bash
bash scripts/server-init.sh shop.yourdomain.com api.yourdomain.com
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
bash scripts/server.sh catalog
bash scripts/server.sh invite your-email@example.com
```

Use your actual domains and email. To keep the same products, users and orders,
transfer a private database dump and media backup instead of starting with an
empty database. Do not expect `git pull` to transfer store data.
