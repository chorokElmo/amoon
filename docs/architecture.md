# Architecture and decisions

## Boundaries

Next.js App Router, strict TypeScript, Tailwind, server components by default. Medusa v2 owns products, individual color/size variants, prices, sales channels, inventory, carts, customers, promotions, orders and fulfillment. Medusa Admin handles store operations; no second admin. PostgreSQL persists commerce data. Redis supports shared sessions, caching, workflow execution, events and locks across API and worker. Docker uses Node 22 LTS for compatibility with both applications.

The storefront will call Medusa server-side using an internal URL and a sales-channel-scoped publishable key. No admin token reaches customers. HTTP-only cart cookies will reference real backend carts. Browser price/stock data is informational; backend workflows calculate prices and validate stock during completion. Standard Medusa cart completion plus a server-side duplicate-submission guard will protect checkout.

## Planned commerce configuration

Morocco region, MAD currency, French storefront, manual fulfillment, explicit Moroccan delivery options and COD. COD will use Medusa's manual payment architecture and real order completion, with collection/capture performed only according to the owner's cash collection policy. Future payment and courier providers stay behind Medusa module interfaces.

Order labels map to core fulfillment/payment state: new = order placed; confirmed = staff confirmation metadata if needed; preparing = fulfillment created; shipped = shipment created; delivered = fulfillment delivered; cancelled = core cancellation. Staff confirmation is not a replacement order state machine. Exact Admin capabilities will be verified in phase 8.

Arabic will use locale dictionaries and a direction-aware root layout; components will use logical CSS properties. Initial locale is fr, direction ltr. Wishlist stays a future integration boundary, not an inert visible control.

## Structure

```text
apps/storefront/src/app/   Routes, server rendering and server endpoints
apps/storefront/public/    Brand assets
apps/medusa/src/           Medusa extensions only when required
apps/medusa/medusa-config.ts
docs/                     Architecture and runbooks
docker-compose.yml        API, worker, migrations, storefront, PostgreSQL, Redis
```

## Environment

Root `.env` drives Compose. `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` construct internal `DATABASE_URL`. `JWT_SECRET` and `COOKIE_SECRET` must be independently generated, minimum 32 characters. `REDIS_URL` is internal. `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` restrict browser origins. `MEDUSA_BACKEND_URL` is the browser-accessible API origin embedded into Admin at build time. `MEDUSA_INTERNAL_URL` is only for server-to-server calls. `STOREFRONT_URL` will be the trusted canonical origin. `MEDUSA_PUBLISHABLE_KEY` must be created and scoped in Admin. `WHATSAPP_NUMBER` contains international digits. No secrets are checked in.

## Assumptions and risks

- Instagram could not be fetched; approved photography and logo are needed before the editorial homepage. Do not present stock imagery as actual products.
- Shipping cities, prices, delivery times and return terms must be confirmed before checkout is released.
- Product media initially uses a persistent local volume for a single VPS. S3-compatible storage is recommended before scaling to multiple API servers.
- Newsletter delivery, transactional email and password reset need a real provider; no fake success UI.
- Production requires HTTPS reverse proxy, firewall, backups, monitoring and an appropriately sized VPS. Database/Redis have no published ports. API/storefront bind to host loopback.
- Build checks alone cannot prove database migrations, Admin login or commerce workflow correctness. Runtime integration must pass before production.
