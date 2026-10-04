# Phase 8 — owner Admin and operations

The existing owner account, MAD/Morocco region, storefront sales channel and free manual delivery configuration are retained. No password is changed, no inventory quantity is invented and no customer/order is seeded.

`npm run check:operations` runs a read-only Medusa script with configuration flags, published-product photography/inventory flags and an order count. It does not print customer information, dispatch addresses or API secrets. The [owner guide](owner-admin-guide.md) covers dispatch setup, real product inventory, the first real order, manual fulfillment and COD reconciliation, with official Medusa references.

Live dispatch address, counted inventory, successful customer order creation, fulfillment and cash collection require actual owner data/actions. These are not claimed complete by the configuration audit. See Phase 7 for checkout testing and its live-order verification limit.

## Observed audit

The native database audit passed for the owner account, MAD/Morocco region, manual COD link, enabled storefront channel, unique dispatch location, sales-channel location link and manual fulfillment link. Dispatch address is absent. One published product (`test`) has no photographs and one unmanaged variant. One existing order (#1) has total 150 MAD, COD metadata and delivery amount 0. The agent did not create this order or modify it. Stored order presence verifies persistence, but does not establish browser receipt access, concurrency behavior or delivery/payment collection.

The order's payment collection is authorized, with no fulfillments. The audit does not capture payment or change fulfillment status. Both Admin and checkout return HTTP 200. Workspace lint and TypeScript checks, the launcher syntax check and the final live audit pass. No storefront or server request behavior changed in this phase; the new script is executed directly through Medusa CLI.
