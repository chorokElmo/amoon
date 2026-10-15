# Checkout shipping-profile correction — 15 October 2026

## Cause confirmed

Medusa workflow `wf_exec_01M4ZPP01T1XAK8AHAAD9A33CE` (`complete-cart`) reverted at `validate-shipping`, before order creation. Its recorded error was:

> The cart items require shipping profiles that are not satisfied by the current shipping methods

The selected shipping option `so_01M4M7F6Q5S23VFVE94EA4457E` uses profile `sp_01M4M11ZAQE691GT9QV6DT2HW8` (Default Shipping Profile). The original working product used that profile; the demo imports had no shipping-profile association. Earlier storefront and variant tests did not cover this final validation step.

## Correction

Assigned the existing Default Shipping Profile to all twelve demo products through hosted Medusa Admin. Read back each product and verified all twelve point to `/app/settings/locations/shipping-profiles/sp_01M4M11ZAQE691GT9QV6DT2HW8`. See `shipping-profile-checks.json` and `shipping-profile-fixed.jpg`.

No real products, delivery fees, payment settings, source code, deployment or database configuration were changed.

## Testing and limits

- A fresh diagnostic cart successfully reached checkout, accepted synthetic delivery details and reached the delivery review with COD available.
- The recorded failed workflow established the precise final-confirmation failure without submitting another order.
- All twelve corrected shipping associations were verified against the shipping profile recorded on the failed delivery option.
- The diagnostic cart item was removed after testing.
- No order, payment authorization or reservation was created during this investigation. A successful final order submission has not been tested by the assistant.

Refresh the checkout, select delivery again, then retry confirmation. The generic storefront error itself has not been changed; this correction fixes the underlying product shipping configuration.
