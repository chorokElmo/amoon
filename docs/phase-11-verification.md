# Phase 11 — deployment preparation and native restore verification

Docker was not started or used. No server/domain was supplied, so no public deployment, DNS changes or TLS configuration were performed. The local no-Docker setup remains the active development environment.

## Implemented

- `npm run backup:native` creates a custom-format PostgreSQL archive and copies actual native product media into an ignored `.local/backups` directory. It checks archive readability and writes a checksum manifest. It accepts only the dedicated native `127.0.0.1:5434/amoon` database, avoids credentials in command arguments/output, and rejects media symlinks.
- `npm run backup:native -- --verify-restore` additionally creates a uniquely named isolated database, restores with error checking in a single transaction, and compares order/product counts. It never drops or overwrites the live database and starts no application against the restored copy. The restored database is retained for review.
- `npm run check:release` checks public HTTPS origins, CORS, independent secrets, catalog identifiers and demo settings without printing their values. Exit code 2 means configuration is not ready. It checks the root Compose environment; it is not a deployment or TLS test.
- The production local-file provider now uses `MEDUSA_BACKEND_URL/static`, so generated uploaded-photo URLs use the configured public API origin. The existing persistent media volume remains the storage target. This is a single-host design.
- The Compose demo fallback is false. The Medusa build launcher uses project-local configuration storage when no explicit configuration directory is set, avoiding a sandbox permission failure writing to the user's home directory.

## Verified locally

The native database archive restored successfully into a separate database. Order and product counts match the backup observation; no actual customer/order was created or changed. The backup manifest includes a SHA-256 digest. Media copying succeeded; the current product still has no uploaded photographs, so restoration of a populated image library is not verified.

The build launcher and new root scripts pass Node syntax checks. Medusa lint and TypeScript checks pass. Isolated configuration checks verify the production upload origin and rejection of development-only in-memory infrastructure. The release check correctly rejects the current localhost URLs/CORS while accepting independent secrets, catalog identifiers and disabled demos. This is an expected local configuration result, not a configuration change to fictitious public domains.

The rebuilt backend and Admin compile successfully. After restarting the native backend, API health, Admin and checkout return HTTP 200, and all four native QA groups pass again. Compose YAML parses successfully; no Docker command was run.

Backups contain actual store/customer data. They are ignored by Git and Docker build context, but are local plaintext archives rather than encrypted off-site backups. Protect them and keep encryption keys/credentials separately. The isolated restore proves database archive restoration, not a full application/queue/media disaster recovery exercise. [PostgreSQL archive backup](https://www.postgresql.org/docs/18/app-pgdump.html) and [restore options](https://www.postgresql.org/docs/18/app-pgrestore.html).

## Before a public release

Supply the real host/domain, choose production PostgreSQL/Redis, configure HTTPS and exact CORS, and review the [Ubuntu runbook](operations.md). Native in-memory infrastructure is explicitly development-only. Do not point an Internet-facing server at the current native launcher. Review the actual dispatch address, stock, photography, owner login/reset and customer notifications. Verify managed stock reservation, live duplicate/concurrent checkout, actual receipt access, manual delivery/COD reconciliation, proxy uploads and encrypted off-site backup/restore before accepting public traffic.

Ubuntu Docker images, Compose startup, reverse proxy/TLS, production Redis worker behavior and off-site recovery remain unverified. Phase 11 is prepared locally; it is not a verified production deployment.

The native database uses PostgreSQL 18, whereas the existing fresh Compose template pins PostgreSQL 16. The verified native archive is not a verified import into PostgreSQL 16. Before migrating native data, provision a compatible PostgreSQL 18-or-newer target and test the import. Do not change an existing volume's database major version in place. PostgreSQL major-version migration and restoring the actual media library must be planned separately.
