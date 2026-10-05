# Server setup validation

- Both Bash helpers pass `bash -n`.
- Secure initialization generates four distinct 64-character hexadecimal secrets.
- Initialization rejects invalid DNS labels and preserves an existing environment file.
- Production Compose validates with `docker compose config --quiet` using isolated
  generated settings. It exposes only the Caddy ports; storage/application services
  have no host-port mappings.
- Isolated mock-Docker checks exercise restoration refusal for a nonempty database
  and active applications, the empty-install restoration path, and catalog settings
  written back to the private environment file.
- Git ignores actual environment files, private test settings, uploads and backups;
  the production example remains available to commit.
- No Docker service was started, no production domain was configured, and the local
  database/storefront/backend were not stopped or changed by these checks.

Container image builds, actual HTTPS certificates and PostgreSQL/media restoration
on Linux still require validation on the target server. Mock checks do not establish
database restore compatibility or a successful production deployment. Native-source
backup/isolated restore tooling already exists separately in `backup-native.mjs`.

## Portability update

The bundled Admin now uses its own browser origin. Checkout bootstrap creates a
missing default shipping profile instead of requiring an already populated store.
Known legacy localhost media origins can be remapped to restored internal storage,
with tests preventing admin-path or unknown-origin proxying. Build-time local
infrastructure is isolated from production runtime PostgreSQL/Redis settings.

Workspace lint and TypeScript, both application builds, 52 commerce tests, four
deployment diagnostic tests, Bash syntax checks, Compose validation and four native
QA groups passed locally. Existing local login-provider endpoint returns emailpass.
New server install/doctor helpers and a GitHub Linux image-build workflow are included.
The GitHub workflow and real production container startup have not been executed
locally; public DNS/TLS, server resources and merchant account/fulfillment remain
target-server checks. No real order or customer was created by verification.
