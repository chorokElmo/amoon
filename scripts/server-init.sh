#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
shop=${1:-}
api=${2:-}
valid_domain() {
  [[ "$1" == *.* && ${#1} -le 253 ]] || return 1
  local label
  local -a labels
  IFS='.' read -r -a labels <<< "$1"
  [[ "$1" != *. && "$1" != .* ]] || return 1
  for label in "${labels[@]}"; do
    [[ ${#label} -le 63 && "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || return 1
  done
}
if ! valid_domain "$shop" || ! valid_domain "$api" || [[ "$shop" == "$api" ]]; then
  echo 'Usage: bash scripts/server-init.sh shop.yourdomain.com api.yourdomain.com' >&2
  exit 1
fi
command -v openssl >/dev/null || { echo 'Install OpenSSL first.' >&2; exit 1; }
[[ ! -e .env.production ]] || { echo '.env.production already exists; preserved unchanged.' >&2; exit 1; }
umask 077
pg=$(openssl rand -hex 32)
jwt=$(openssl rand -hex 32)
cookie=$(openssl rand -hex 32)
cart=$(openssl rand -hex 32)
# Exclusive creation prevents accidentally overwriting existing credentials.
set -o noclobber
cat > .env.production <<EOF
STOREFRONT_DOMAIN=$shop
API_DOMAIN=$api
STOREFRONT_URL=https://$shop
MEDUSA_BACKEND_URL=https://$api
STORE_CORS=https://$shop
ADMIN_CORS=https://$api
AUTH_CORS=https://$shop,https://$api
POSTGRES_USER=amoon
POSTGRES_DB=amoon
POSTGRES_PASSWORD=$pg
JWT_SECRET=$jwt
COOKIE_SECRET=$cookie
CART_COOKIE_SECRET=$cart
MEDUSA_PUBLISHABLE_KEY=
MEDUSA_REGION_ID=
MEDUSA_SALES_CHANNEL_ID=
PRODUCT_IMAGE_ORIGINS=https://$api
WHATSAPP_NUMBER=
NEWSLETTER_SUBSCRIBE_URL=
NEWSLETTER_API_TOKEN=
EOF
echo 'Created private .env.production with independent secrets. No credentials printed.'
