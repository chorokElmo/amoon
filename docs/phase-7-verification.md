# Phase 7 — Morocco checkout and manual COD

Checkout at `/commande` uses the visitor's signed persistent Medusa cart. It saves actual customer contact/address information, lists real eligible Medusa delivery options, applies the chosen option, presents backend totals, and creates a manual COD payment session only on final submission. A final checkbox and button confirm the displayed total. Medusa completion must return `type: order`; HTTP 200 payment failures do not become confirmations. The confirmation route retrieves the actual order using a separate signed HttpOnly receipt cookie, valid for one day. No URL order ID grants access through the storefront.

The owner corrected the delivery fee from 35 MAD to **free delivery**. The actual Morocco delivery option is priced at 0 MAD. `npm run configure:checkout` reuses the configured region/channel, links manual payment, creates/reuses the Amoon fulfillment location/set, Morocco service zone and default-profile delivery option. A repeat run was checked. No products, stock quantities, customer addresses or orders are seeded. The fulfillment location has no invented street address; the owner should enter actual dispatch information before shipping operations in Phase 8.

Phone validation accepts Moroccan geographic/mobile formats `05`, `06`, `07`, `+212` and `00212`, and stores a canonical international number. Email, first/last name, city and complete street address are required. Country is fixed to Morocco. A provided postal code must have five digits; it is optional. All validation runs on the server as well as form-required checks in the browser. Customer details are not logged by storefront routes.

## Submission safeguards

- Origin and JSON checks, bounded 8 KiB request bodies, private/no-store responses and cart IDs from a signed HttpOnly cookie.
- A ten-minute signed review covers the actual cart/items/totals, normalized customer details, selected delivery and COD availability. Changed/expired reviews fail before completion; line ordering is canonicalized for signing.
- Fresh product eligibility checks, payment-collection amount verification and another review check before Medusa completion. Existing compatible manual sessions are reused; stale sessions are reinitialized. The server marks the cart's payment method as COD metadata while retaining existing metadata.
- A Medusa completion hook compares the payment collection and processable manual sessions to the exact completion cart total and requires Morocco delivery details and a delivery method. This runs inside Medusa's completion lock, preventing an unnoticed amount change between storefront checks and order creation.
- Pending controls prevent repeated clicks. There are no automatic mutation retries. Already-completed carts use Medusa's idempotent completion to recover the existing order rather than create a new cart/payment. Confirmation failures direct the customer to recover their order before ordering again.
- Manual payment authorizes offline collection. No capture, actual cash collection, courier booking or automatic confirmation email is performed by this checkout. The merchant captures/marks payment only after actually receiving cash.

## Verified on 2026-10-04

- 45 isolated catalog/product/cart/checkout/backend-validation tests pass. Coverage includes normalized phone/address validation, signed-review integrity/expiry, foreign shipping choices, consent, changed totals, mismatched payment amounts, HTTP 200 payment failures, completed-cart recovery and receipt field minimization. Isolated test fixtures never enter the running database/catalog.
- Workspace lint and strict TypeScript checks pass. Storefront, Medusa backend and compiled Admin builds pass; the configuration launcher passes Node syntax checking.
- Actual native Medusa returns the enabled `pp_system_default` manual provider and the owner-approved delivery option with amount 0. The real product remains 150 MAD. A signed-cart checkout API snapshot includes these actual values and no invented customer details.
- Live checkout API negative tests verify invalid/incomplete customer data (400), foreign delivery choice and invalid final review (409), foreign Origin (403), wrong content type (415), malformed JSON (400), oversized body (413), forged-cookie rejection and private/no-store responses.
- Browser form required-field validation stops submission and focuses the empty email input. The form shows the real product and actual total, with functional cart navigation and progressive steps. At 390 px the document is 375 px; at 1280 px the document is 1265 px, with no horizontal overflow. Desktop/mobile screenshots were inspected and temporary viewport changes reset.

## Live-order verification still required

No real customer address was supplied and no live order was submitted. Successful completion, real concurrent/repeated submissions, managed inventory reservation, order appearance in Admin and courier/COD operations therefore still need a real customer/owner-approved order. These are not claimed as live-verified. The UI and server flow are implemented; Phase 7 is not fully live-verified until that order check is done. The current owner product uses unmanaged inventory and has no photographs. Production Docker/multi-worker deployment remains a later phase.

References: [Medusa checkout](https://docs.medusajs.com/resources/storefront-development/checkout), [cart completion](https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart), [manual payment](https://medusajs.com/integrations/medusajs-payment), [ANRT numbering](https://www.anrt.ma/infos-pratiques/ce-que-vous-devez-savoir/numerotation), and the installed Medusa workflow/API definitions.

Subsequent Phase 8 read-only verification found an existing persisted order #1 with total 150 MAD, COD metadata and free shipping. No order was submitted by the agent. This updates the earlier observation of no live order; browser confirmation/recovery, concurrent submissions and actual delivery/cash collection still need verification.
