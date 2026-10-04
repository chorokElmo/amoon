# Run without Docker

The project now supports a real local Medusa backend using the installed Windows PostgreSQL binaries. No sample merchandise is seeded. The homepage reads the same Medusa catalog as the shop; it displays an honest unavailable or empty state until actual products are published. Illustrative photography, invented product prices and the unverified best-sellers section have been removed from the homepage.

## Local services

- Storefront: http://localhost:8000
- Medusa API and Admin: http://localhost:9001 and http://localhost:9001/app
- Dedicated PostgreSQL: 127.0.0.1:5434, database `amoon`, files in ignored `.local/postgres`.

The existing Windows PostgreSQL service on 5432 is untouched. Port 9001 avoids Windows' reservation of port 9000 in this session. `setup:native` initializes and starts a separate cluster, applies migrations, creates or reuses the actual Morocco/MAD region and Amoon sales channel/publishable key, and saves the connection in ignored environment files. Generated secrets are preserved across runs. Set `PG_BIN` if PostgreSQL is installed elsewhere.

From CMD in the project directory:

```cmd
npm run setup:native
npm run build --workspace @amoon/medusa
npm run dev:native
```

In another CMD:

```cmd
npm run dev:storefront
```

The native runner serves the compiled Admin, avoiding the Vite dependency optimizer's file-access errors in the Codex sandbox. Rebuild Medusa and restart `dev:native` after backend/Admin changes. `NODE_ENV=local` selects compiled Admin serving; native infrastructure is explicitly enabled and production mode or a separate worker is rejected.

Uploaded photos are stored in ignored `apps/medusa/static`, linked from the compiled backend's served folder. They survive normal backend rebuilds. The file provider emits URLs on port 9001. If the compiled folder already contains uploads, the runner refuses to replace them: move them into the persistent folder first. Do not delete the persistent folder during deployment cleanup.

The database persists products, inventory, customers and orders. Events, cache, locks and workflow execution use Medusa's local/in-memory development implementations, so pending background work does not survive a backend restart. This is a development environment, not a production deployment. Production continues to use the configured Redis services. See [Medusa infrastructure documentation](https://docs.medusajs.com/resources/infrastructure-modules).

## Owner invitation

```cmd
npm run invite:native -- YOUR_EMAIL
```

The command creates a real Medusa invitation and writes a private link into ignored `.local/admin-invite.html`. Open that file and follow the link to choose your own password. The invitation has an expiry. No email is sent, and no password is invented or written to source control. If an invitation already exists, use that link or refresh it through Admin instead of repeatedly creating invitations.

After signing in, publish your actual products, upload actual photographs, enter MAD prices and sizes/colors, link stock locations, and make the products available to the **Amoon Storefront** sales channel. The homepage and catalog then show those real records. Free delivery and cash on delivery are configured, and checkout is implemented. Completing a live order still requires the owner's real delivery details; see `phase-7-verification.md` for remaining verification and dispatch setup.

## Verified on October 4, 2026

Both workspace lint and TypeScript checks pass. Storefront and backend/Admin builds pass, and all 22 catalog tests pass. Native migration/setup succeeded; repeating setup reused existing resources. `/health` and keyed Store API requests return HTTP 200 with the Morocco/MAD region and a real product count of zero. Browser verification shows the connected homepage's empty state and the admin invitation's account creation form. At the observed 740px viewport the homepage has no horizontal overflow and no demo image elements. No password has been chosen, and no invitation email was sent.

## Windows sandbox note

`initdb` succeeded after explicitly creating its data directory. `pg_ctl start` cannot create its restricted child token in this Codex session; PostgreSQL was started directly using the installed `postgres.exe` with the same sandbox account, bound to 127.0.0.1:5434. On your own CMD, the setup runner normally uses `pg_ctl`. If necessary, keep a separate CMD running:

```cmd
"C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%CD%\.local\postgres" -h 127.0.0.1 -p 5434
```

Start all commands from the project directory. Do not remove `.local/postgres` unless you intend to discard this development database.
