# Phase 2 — storefront foundation

Implemented a shared cream/ink/sand palette, typography and spacing tokens; button and icon primitives; reusable wordmark; sticky responsive header; shared footer; accessible menu/search dialogs and a skip link. Typography uses local system sans/serif stacks, with no external font requests. Pages remain server components except the interactive header/dialog boundary.

French navigation labels and root language/direction are centralized in `src/lib/i18n.ts`. Layout CSS uses logical padding, margins, borders and inset properties. Locale support is a foundation; Arabic translations and RTL visual QA remain future work.

Navigation resolves to home, boutique, nouveautés, collections, contact and panier. Future commerce pages explicitly state that online purchases/catalog are not open. Search submits a GET query to `/boutique`, which safely renders the query and an availability message, not pretend product results. Cart quantities will come from real Medusa carts in Phase 6; no fabricated badge is shown. Accounts and wishlists have no inert controls.

Contact links to the supplied Instagram account. WhatsApp is displayed only when `WHATSAPP_NUMBER` has 8–15 international digits; it is read from server-side configuration and never duplicated as a hard-coded number. No email/newsletter forms submit fake success results.

## Validation

- Workspace lint and strict TypeScript checks passed.
- Storefront production build passed with all added routes.
- Browser review at desktop 1440px, tablet/default width and mobile 390px; narrow 320px home/contact checks showed no horizontal overflow.
- Mobile menu opens as a native modal dialog, closes with Escape and restores focus to its opener; Contact navigation closes the menu.
- Reverse Tab wraps from Close to Contact, forward Tab wraps from Contact to Close; search opens with focus in its input.
- Search submits `Robe Lina` and reaches `/boutique?q=Robe+Lina`, showing the supplied query and opening state.
- Desktop navigation, active-page indicators, sticky header and footer reviewed. Native dialogs provide modal focus containment; body scrolling is locked while open.
- Reduced-motion preferences remove transitions. Icon targets are 44px; form fields use 16px text on phones.

Full editorial/product homepage is Phase 3. Backend catalog, stock, cart and checkout still require their subsequent phases and runtime commerce verification.
