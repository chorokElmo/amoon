# Implementation phases

1. Architecture, Next.js/Medusa foundations, PostgreSQL, Redis and Docker. Record lint, strict TypeScript, builds and runtime limitations.
2. Design tokens, reusable primitives, responsive header/footer and French locale conventions.
3. Editorial homepage using approved brand and product photography.
4. Medusa-backed catalog, collections, category/size/color/price/stock filters, search and sorting.
5. Product pages, galleries, real variants and stock, size guide and related products.
6. Real persistent Medusa carts, quantity updates and removal.
7. Moroccan validated checkout, shipping choices, COD and real backend order completion; retry/duplicate-submission checks.
8. Owner Admin setup, sales channel, MAD/Morocco region, inventory locations, delivery options and order operations. Opt-in demo seed with independently stocked variants and a safe deletion strategy.
9. Configurable WhatsApp, metadata, canonical URLs, product JSON-LD, sitemap/robots and consent-aware analytics integration boundary.
10. Mobile/desktop/browser and keyboard QA; error/loading/empty states; security/performance review; backend checkout integration tests.
11. Verify Ubuntu Docker deployment, reverse proxy, backups/restore and production release runbook.

Run lint and typecheck after each phase, builds where appropriate. Fix failures before advancing. Never label a phase verified when infrastructure prevented the relevant checks.
