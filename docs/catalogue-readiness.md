# Catalogue readiness

The storefront keeps Medusa as the source of truth. It never deletes or rewrites product records.

Published products are shown only when they have a title and handle, a nonempty description different from the title, an approved image URL, and a positive MAD price on every variant. Sold-out, backorder, unmanaged inventory and genuine single-option products retain their existing behavior. No product is classified as test merchandise merely because of its name or default variant.

Boolean Medusa product metadata `storefront_hidden`, `is_test`, or `is_demo` set to `true` hides a record. Alternatively, use Medusa's standard draft status or remove it from the storefront sales channel. Correcting incomplete fields or clearing these flags restores visibility on the next catalogue refresh (up to 30 seconds).

The same check protects direct cart additions and quantity updates. Existing items can still be removed. Image origins must match the existing configured backend or allowed product/legacy origins. The UI retains its broken-image fallback; network failures are not treated as reasons to delete merchant data.

## Merchant handoff

The local catalogue audited on 2026-10-13 contains one published record, `jacket`, at 150 MAD, with a real image, a description identical to its title, and one default variant with unmanaged inventory. It is hidden until its description is completed. Its price is reported from Medusa, not independently approved.

The merchant must confirm the product title, description, price, real sizes/colors (or genuine single-option availability), inventory tracking/backorder policy and category/collection assignment. Arabic product content remains optional merchant-authored metadata with French fallback. No catalogue data was changed during this audit.

Production delivery still requires an audit of the deployed Medusa catalogue, approval of merchant data, reachable production image URLs and a successful real variant/cart test on the deployed storefront. The staging URL was unavailable to the web inspection tool during this audit.
