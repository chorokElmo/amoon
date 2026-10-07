# Clone Amoon on another Windows PC

GitHub contains the code, Medusa configuration code, migrations, environment templates and reproducible setup scripts. Database settings and store records are not source files.

## Start with a fresh local store

Install Git, Node.js 22.12+ with npm and PostgreSQL 18. Close and reopen CMD after installing Node. Check `node -v` and `npm -v` first.

```cmd
git clone https://github.com/chorokElmo/amoon.git
cd amoon
npm ci
npm run setup:pc
```

This generates independent local secrets, initializes the dedicated database on port 5434, applies migrations, creates/reuses Morocco/MAD and the storefront sales channel/key, configures the approved free delivery and cash on delivery, and builds Admin. It does not create sample products, accounts or orders. Existing settings/secrets are reused on repeat runs. Stop other Amoon installations using port 5434 before setting up a different local cluster. Do not run two separate clusters on the same port.

If PostgreSQL is installed elsewhere, first run `set "PG_BIN=C:\path\to\PostgreSQL\bin"` in CMD.

```cmd
npm run dev:native
```

In another terminal:

```cmd
cd C:\path\to\amoon
npm run dev:storefront
```

Website: http://localhost:8000. Admin: http://localhost:9001/app.
Create your own first admin invitation if using a fresh database:

```cmd
npm run invite:native -- your-email@example.com
```

Open `.local/admin-invite.html` privately and choose your password. No default credentials are shipped. Products must be added/published through Admin.

## Keep exactly the same products and Medusa settings

Cloning alone cannot reproduce database changes made through Admin. Make a private backup on the original PC:

```cmd
npm run backup:native -- --verify-restore
```

The generated `.local/backups/<timestamp>/` contains `database.dump`, `media/`, and `manifest.json`. It includes products, prices, variants, stock, customers, orders, admin accounts and database configuration. Transfer it privately. Never push it, `.env`, or invitations to GitHub. Do not copy the raw PostgreSQL data directory between PCs.

For a shared store across PCs, use the existing production deployment and restore workflow in [new-server.md](new-server.md). All storefronts then connect to one backend/database/media store. This is preferable to independent databases whose changes diverge.

A native backup is not restored by `setup:pc`: restore into an empty PostgreSQL database, point Medusa's private DATABASE_URL at it, restore `media/` to `apps/medusa/static`, and refresh the storefront connection using the restored region/channel/key. Do not overwrite a database containing new orders. The production guide provides the automated empty-database restore path.

## What to commit

Commit configuration **code**, `.env.example` with empty secrets, migrations, setup scripts and documentation. Real passwords, signing keys, customer records, uploaded photos and private backups remain excluded by `.gitignore`.

If an earlier `.env.example` contained usable secrets and was pushed, treat those values as exposed. Replace them in the relevant private deployment configuration before production use; merely removing them from the latest commit does not remove Git history. This setup does not rotate an existing store's secrets automatically.
