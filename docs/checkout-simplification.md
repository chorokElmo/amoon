# Simplified Moroccan checkout

The customer form now has five fields: full name, phone, city, delivery address and an optional landmark/complement. Email, separate first/last names, postal code and visible country entry have been removed. Morocco is enforced by the server. The full name maps to the first token as first_name and remaining tokens as last_name; a single-token name is accepted without inventing a surname. Existing address structure and signed checkout review remain compatible.

Email is nullable throughout checkout and the backend COD validation no longer requires it. Submitting the new form clears legacy cart email to null. No fake email is generated. Amount, payment, stock, delivery choice and final-consent validation are preserved.

The database had no shipping setup. After the owner selected free delivery, the existing configure-checkout script added the Morocco service zone, fulfillment location/channel links, manual COD provider and zero-MAD shipping choice. No per-city fee table exists, so city remains a text field rather than a dropdown with invented coverage.

Live verification created isolated technical test order #1 (order_01M461B5T1JY3NMSFQCGN1DMSY), 150 MAD with free delivery and email NULL verified directly in PostgreSQL. The delivery address and complement explicitly say test/do not ship. The signed receipt renders successfully with HTTP 200. The user's browser cart was not consumed or changed by the order test. An initial test stopped before shipping setup and left an uncompleted isolated cart.

Both backend and storefront builds pass. ESLint and all 50 regression tests pass, including new full-name/no-email/default-Morocco, clearing stale email and COD completion coverage. Browser checked the exact five inputs, labels/placeholders, tel keyboard, no email/postal/country fields and no page overflow at 1440/768/390. No new console errors. Local screenshot: .local/checkout-five-fields.png.
