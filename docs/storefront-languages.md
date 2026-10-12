# French and Arabic storefront

French is the default. The desktop header, mobile header and mobile menu offer **FR | العربية**. The `amoon_locale` cookie remembers the preference for one year. Switching refreshes server-rendered content on the current URL; it does not replace the signed cart or order cookies. Existing canonical URLs are unchanged. No hreflang is emitted because there are no separate language URLs.

Static messages live in `apps/storefront/src/lib/messages-ar.json`, keyed by their French source text. Client components use `useTranslations()`; server components use `getTranslations()`. Translate visible labels, placeholders, accessibility text, metadata and validation messages. Do not translate route handles, option identifiers, filter values or stock codes.

Arabic uses Cairo (400/600) for headings and controls and Tajawal (400/500) for body text, loaded through `next/font/google` and self-hosted by Next.js. Fonts are not preloaded. Google font downloads require network access at build time. French typography is preserved.

## Authoring Arabic product content

Medusa remains the source of truth. Add reviewed Arabic content to the existing product's **metadata** using the Medusa Admin metadata editor (if available) or the existing authenticated Admin API. No backend module or database migration is required:

```json
{
  "translations": {
    "ar": {
      "title": "اسم المنتج بالعربية",
      "description": "وصف المنتج بالعربية",
      "composition": "الخامة وتعليمات العناية",
      "size_guide": "قياسات هذه القطعة",
      "variants": {
        "variant_ACTUAL_ID": "وصف الخيار بالعربية"
      }
    }
  }
}
```

Use the actual existing variant IDs. Merge this object with existing metadata; preserve other metadata fields. Leave a translation field absent until its Arabic content has been reviewed. Missing or blank fields fall back individually to the original French content. No automatic or external translation service runs. Product handles, variant option values, images, prices, inventory and checkout identifiers remain unchanged. Arabic search includes both original French and authored Arabic product text.

Catalog and product pages use translated fields. Cart and checkout apply translated product/variant titles for display only; persisted Medusa line items and monetary totals remain unchanged. Unpublished products in an existing cart retain their original saved titles.

Standard size/color labels have reviewed Arabic equivalents. Custom option names and values, collection names, owner-authored homepage campaigns, addresses and policy text preserve their original content when no reviewed dictionary entry or Arabic content is available. Add reviewed equivalents to the dictionary for store-specific static content; never invent product translations.

## Checks and scope

Run `node --test tests/catalog.test.mjs tests/i18n.test.mjs`, storefront lint, TypeScript and a production frontend build. Check both desktop and mobile, switching on catalog/cart/checkout, RTL drawers and swipe direction, and native form validation. Do not complete a real order merely to test translations.

There are no customer login or account pages in this storefront. Medusa Admin is a separate application and is not translated by this frontend change.
