# Install Amoon on a new Linux server

This production configuration runs the storefront, Medusa API/Admin, a worker,
PostgreSQL 18, Redis and Caddy HTTPS. It does not change native Windows development.
Only ports 80/443 are exposed by Compose. PostgreSQL, Redis and application ports
remain private to the Docker network. Production volumes use a separate project
name and do not reuse the older development PostgreSQL 16 volumes.

## Prepare the server

Use a Linux server with Git, Bash, OpenSSL, Docker Engine and Docker Compose v2.
Install Docker from its official guide: https://docs.docker.com/engine/install/ubuntu/
Node.js and Redis do not need installing on the host; their containers supply them.
Allow inbound 80/443 and restrict SSH in the hosting firewall.
Point two DNS names at this server: for example `shop.yourdomain.com` and
`api.yourdomain.com`. Remove incorrect AAAA records if the server has no IPv6.
Caddy obtains HTTPS certificates when those domains resolve and ports are reachable.
Allow sufficient disk/memory for the first Medusa/Next builds; use Docker's build
logs to diagnose an out-of-memory failure rather than repeatedly restarting it.

```bash
git clone https://github.com/chorokElmo/amoon.git
cd amoon
bash scripts/server-init.sh shop.yourdomain.com api.yourdomain.com
bash scripts/server.sh build
```

Use your actual domains. The init script generates four independent secrets and
refuses to overwrite an existing `.env.production`. That private file is ignored
by Git. Preserve it securely. Do not print `docker compose config` publicly because
its resolved output includes credentials; the helper uses `config --quiet`.

## Option A: transfer the existing store

On the Windows PC, in `amoon-clone`, run:

```powershell
npm run backup:native -- --verify-restore
```

It produces a private folder under `.local/backups` containing `database.dump`,
`media/` and `manifest.json`. Transfer that entire folder privately with SFTP/SCP,
for example to `backups/from-pc` in the server checkout. Never upload it to GitHub.
Schedule the final transfer while the old store is not accepting orders so later
writes are not lost. Your current native PostgreSQL is version 18, which matches
the new production image. Do not copy raw PostgreSQL data directories.

Before first application startup, run on the server:

```bash
bash scripts/server.sh restore backups/from-pc
bash scripts/server.sh start
bash scripts/server.sh catalog
```

Restore refuses a database with existing public tables or running applications.
The catalog command reuses the Morocco/MAD region, storefront channel and key,
connects the storefront, and configures the owner's free delivery and COD. It
creates no sample merchandise, customers or orders. Existing Admin users are
preserved; sign in using your own account. Old browser carts/sessions are not
transferred because the new server uses new signing secrets.

For transferred photographs, review any product image URLs still pointing to
`localhost:9001`. Re-upload those photographs in the new Admin so the saved URLs
use the new public API domain. The private media backup retains the original files.
Verify actual product photos, MAD prices, inventory and saved orders before launch.

## Option B: create a fresh store

```bash
bash scripts/server.sh start
bash scripts/server.sh catalog
bash scripts/server.sh invite your-own-email@example.com
```

The invitation output is stored privately at `.local/server-admin-invite.txt`.
Use its token in `https://api.yourdomain.com/app/invite?token=YOUR_TOKEN` to choose
your password. No invitation email is sent. Do not share the token or commit it.
Create and publish your real products in Admin and assign the Amoon Storefront
sales channel. Add actual stock locations/dispatch details and verify fulfillment.

## Verify and maintain

```bash
bash scripts/server.sh status
curl -f https://api.yourdomain.com/health
curl -f https://shop.yourdomain.com/api/health
bash scripts/server.sh backup
```

Check Admin login, actual catalog images, a real cart and checkout totals, HTTPS
cookies and your delivery process. Configure your actual WhatsApp/newsletter values
in `.env.production`, then rerun `start` to recreate changed containers. Changing
the API domain requires rebuilding the Admin image. Configure private off-server
backup retention with your hosting provider; `backup` alone does not schedule or
send backups off the server. Database and media backups should be made during a
maintenance window with writes paused for a consistent snapshot.

For updates, save a backup first, pull reviewed changes, build, stop application
containers, run migrations once, and restart:

```bash
bash scripts/server.sh backup
git pull --ff-only
bash scripts/server.sh build
docker compose --env-file .env.production -f docker-compose.production.yml stop proxy storefront medusa worker
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
bash scripts/server.sh start
```

Keep the previous Git revision and a verified backup for recovery. Do not use
`docker compose down -v`: it deletes store data. Existing development and production
compose files use different volume names. Protect the Admin with your hosting
access policy where practical without blocking required Store API access.

## Push only code and templates

The production YAML, Caddyfile, helper scripts and `.env.production.example` belong
in GitHub. `.env`, `.env.production`, `.local`, database dumps and uploaded photos
remain private. Build contexts exclude private configuration and Medusa uploads.
The real domains, DNS, server account and data transfer still need your own values.

References: https://hub.docker.com/_/postgres and
https://caddyserver.com/docs/automatic-https
