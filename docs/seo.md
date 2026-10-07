# SEO configuration

Set STOREFRONT_URL in the storefront environment to the actual public HTTPS origin, without a path or trailing query. Production server setup supplies this value. Localhost receives noindex metadata and robots disallowing crawling. Public pages receive canonical URLs, French page descriptions, social metadata, brand and product/breadcrumb JSON-LD. Product prices and availability come from Medusa; no reviews or ratings are fabricated.

Filtered catalog results are noindex/follow. Unfiltered paginated catalogs use their own canonical page URLs. Cart, checkout and favorites remain noindex. The dynamic sitemap includes catalog product/collection URLs and fails explicitly if the backend cannot supply the catalog.

After public deployment, verify the domain in Google Search Console. Optionally set GOOGLE_SITE_VERIFICATION to the HTML verification token and restart the storefront. Submit https://YOUR-DOMAIN/sitemap.xml and inspect a homepage and real product URL. Check structured data using Google's Rich Results Test. These external submissions are not performed automatically.

Localhost cannot be indexed by Google. Deployment and Search Console access are needed to verify production indexing. Use real product names, useful descriptions, accurate MAD prices and original product photos in Admin; test records such as qdsq and test will otherwise become the indexed product content.
