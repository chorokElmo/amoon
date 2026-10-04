# Local catalog setup

Prepared local environment files with independent random database/JWT/cookie secrets. They are ignored by Git and Docker builds. Existing non-empty values are preserved by `npm run prepare:local`. Development PostgreSQL uses port 5433 so the existing Windows PostgreSQL service on 5432 is untouched.

## Run

Open Docker Desktop under your Windows account and wait for **Engine running**. From the project directory in CMD:

```cmd
npm run setup:local
```

This command builds the Medusa image, starts the dedicated Compose database/Redis/API/worker services, runs migrations through the existing migrate service, creates/reuses the Amoon Storefront sales channel, creates/reuses a publishable API key, creates/reuses the Morocco region in MAD, configures store defaults and writes the verified connection values to the root and storefront `.env` files. It does not start another storefront on port 8000, create sample merchandise, or modify the existing Windows PostgreSQL service.

The backend script uses Medusa workflows and refuses to move Morocco from another region or choose between duplicate Amoon resources. It only creates publishable keys, never secret Admin keys. It preserves other supported currencies. The generated result file `.catalog-setup.json` is ignored and is outside the served media directory.

After success, restart your existing `npm run dev:storefront` process to load the connection. Open `http://localhost:9000/app` for Medusa Admin. Owner account creation and product/stock configuration remain separate steps; no account password is invented. Publish products to the Amoon Storefront channel and link inventory locations as described in `catalog.md`.

## Current verification

Environment preparation, Medusa lint/strict TypeScript and backend/Admin builds pass. The setup scripts pass syntax checks, and Compose configuration validates. Docker's engine now runs, but this Codex account cannot access its named pipe. Docker setup has not completed. A separate [native development setup](native-development.md) now runs without Docker: actual database migrations, API key/channel creation and Morocco/MAD region configuration succeeded; health and Store API verification pass on port 9001. The real catalog currently has zero products. The Docker runner still fails before changing database state when its engine cannot be accessed.
