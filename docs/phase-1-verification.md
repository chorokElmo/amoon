# Phase 1 verification — 3 October 2026

## Delivered

Empty workspace inspected; no existing repository or application was replaced. Node 24.16.0, npm 11.13.0 and Docker CLI 29.2.1 were available. Created an npm workspace with exact dependency versions and a shared lockfile. Next.js 16.3.8, Medusa 2.21.2, Tailwind 4.3.3, TypeScript 5.9.3. Docker uses Node 22 LTS.

Created Next.js App Router/French root layout, a minimal opening page, brand favicon and health endpoint. Configured Medusa with its existing Admin, required secrets, strict TypeScript, Redis-backed caching/events/workflows/locking and API/worker modes. Added PostgreSQL, Redis, migration/API/worker/storefront services, health checks, persistent volumes and development-only database port overrides.

Added architecture, phase plan, environment examples, Ubuntu deployment, migration/update and backup/restore documentation. No demo data, shipping configuration, product storefront or checkout has been implemented yet.

## Passed

- `npm run lint` for both workspaces.
- `npm run typecheck` for both workspaces, repeated after Medusa generated its types.
- Next.js production build, including static home page and dynamic health route.
- Medusa production backend and Admin frontend build.
- `docker compose config --quiet` using temporary validation variables, without creating services.
- Standalone storefront HTTP smoke check: home page 200, French root markup, brand text, health status `ok`, stylesheet 200 and expected palette.

## Local environment adjustments

The npm cache was directed into the chat's `work/` directory because the normal cache was not writable. Medusa CLI configuration used `XDG_CONFIG_HOME` in `work/` for the same reason. SWC 1.16.13 failed to load under this Windows sandbox's cache/ACL rules; Medusa's direct build compiler dependency is pinned to compatible SWC 1.11.31, which built successfully. No system permissions were modified. These local cache paths are not part of the production application.

## Not verified

Docker CLI could not connect to `docker_engine`: no running daemon was available. Docker image builds, actual PostgreSQL migrations, API/worker startup, uploaded-media persistence and Admin login remain unverified. Compose validation does not prove those runtime behaviors. Run the commands in `operations.md` on an Ubuntu VPS or a machine with Docker running before considering infrastructure verified.

This foundation is not production-ready commerce. Phases 2–11 and their integration/release checks remain.
