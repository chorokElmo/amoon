#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env.production ]] || { echo 'Run server-init.sh with your two domains first.' >&2; exit 1; }
dc() { docker compose --env-file .env.production -f docker-compose.production.yml "$@"; }
dc config --quiet
case "${1:-}" in
  build) dc build ;;
  start) dc up -d --wait postgres redis medusa worker storefront proxy ;;
  status) dc ps ;;
  logs) dc logs --tail=100 medusa worker storefront proxy ;;
  doctor)
    docker run --rm --env-file .env.production --mount "type=bind,src=$PWD/scripts/server-check.mjs,dst=/checks/check.mjs,readonly" node:22-bookworm-slim node /checks/check.mjs
    ;;
  install)
    bash scripts/server.sh build
    bash scripts/server.sh start
    bash scripts/server.sh catalog
    if [[ -n "${2:-}" ]]; then bash scripts/server.sh invite "$2"; fi
    bash scripts/server.sh doctor
    ;;
  catalog)
    dc exec -T medusa npx medusa exec ./src/scripts/setup-catalog.js
    dc exec -T -e AMOON_DELIVERY_FEE=0 medusa npx medusa exec ./src/scripts/setup-checkout.js
    for pair in 'MEDUSA_PUBLISHABLE_KEY:publishable_key' 'MEDUSA_REGION_ID:region_id' 'MEDUSA_SALES_CHANNEL_ID:sales_channel_id'; do
      key=${pair%%:*}; field=${pair#*:}
      value=$(dc exec -T medusa node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('.catalog-setup.json','utf8')).$field)")
      [[ "$value" =~ ^[A-Za-z0-9_]+$ ]] || { echo 'Invalid catalog connection output.' >&2; exit 1; }
      sed -i "s/^$key=.*/$key=$value/" .env.production
    done
    dc up -d --force-recreate storefront
    echo 'Real Morocco/MAD catalog connected; free delivery/COD configured. No sample products created.'
    ;;
  invite)
    [[ "${2:-}" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || { echo 'Provide your owner email.' >&2; exit 1; }
    umask 077; mkdir -p .local
    dc exec -T medusa npx medusa user --email "$2" --invite > .local/server-admin-invite.txt
    echo 'Private invitation output saved to .local/server-admin-invite.txt. No email was sent.'
    ;;
  backup)
    umask 077; target="backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"; mkdir -p "$target/media"
    dc exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-privileges' > "$target/database.dump"
    dc exec -T postgres pg_restore --list < "$target/database.dump" > "$target/archive-list.txt"
    dc cp medusa:/app/static/. "$target/media/"
    echo "Private database/media backup saved: $target"
    ;;
  restore)
    source_dir=${2:-}
    [[ -f "$source_dir/database.dump" && -d "$source_dir/media" ]] || { echo 'Provide a private backup folder containing database.dump and media/.' >&2; exit 1; }
    if dc ps --status running --services | grep -Eq '^(medusa|worker|storefront|proxy)$'; then
      echo 'Restore only before starting the applications.' >&2; exit 1
    fi
    dc up -d --wait postgres redis
    tables=$(dc exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname=current_schema()"')
    [[ "$tables" == '0' ]] || { echo 'Database is not empty. Restore refused; existing data preserved.' >&2; exit 1; }
    dc exec -T postgres pg_restore --list < "$source_dir/database.dump" > /dev/null
    media_path=$(cd "$source_dir/media" && pwd)
    dc run --rm --no-deps --user root --entrypoint sh -v "$media_path:/restore:ro" migrate -c 'test -z "$(find /app/static -mindepth 1 ! -name .gitkeep -print -quit)" && cp -a /restore/. /app/static/ && chown -R node:node /app/static'
    dc exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --exit-on-error --single-transaction --no-owner --no-privileges' < "$source_dir/database.dump"
    echo 'Database and media restored into the empty production installation. Now run start, then catalog.'
    ;;
  *) echo 'Usage: bash scripts/server.sh {install [EMAIL]|build|start|catalog|invite EMAIL|doctor|status|logs|backup|restore BACKUP_FOLDER}' >&2; exit 1 ;;
esac
