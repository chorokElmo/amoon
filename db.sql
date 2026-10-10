-- Morocco country seed for Medusa 2.21.2 / PostgreSQL.
-- Run Medusa migrations first: npm run db:migrate
-- Import into the database used by apps/medusa/.env (DATABASE_URL).
-- Example for the default local database (psql prompts for its password):
-- psql -h localhost -p 5433 -U amoon -d amoon -W -v ON_ERROR_STOP=1 -f db.sql
-- Or execute this file in your database client's SQL editor.
-- Schema: https://raw.githubusercontent.com/medusajs/medusa/v2.21.2/packages/modules/region/src/models/country.ts
-- Existing country details and region assignments are preserved.
-- This seeds a country only; it does not create API keys or a sales channel.
-- For the complete local store (MAD, channel, key, shipping and manual COD), run:
-- npm run setup:store
-- That command runs migrations and copies connection values into storefront .env.
-- Running this SQL file separately is unnecessary for that setup.

BEGIN;

INSERT INTO region_country (iso_2, iso_3, num_code, name, display_name)
VALUES ('ma', 'mar', '504', 'MOROCCO', 'Morocco')
ON CONFLICT (iso_2) DO NOTHING;

-- Inspect the stored country and its current region assignment.
SELECT iso_2, iso_3, num_code, name, display_name, region_id
FROM region_country
WHERE iso_2 = 'ma';

COMMIT;
