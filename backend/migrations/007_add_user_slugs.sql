-- Add user slugs for profile URLs
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Backfill missing slugs from name or email prefix
WITH base AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(TRIM(name), '') <> '' THEN lower(regexp_replace(TRIM(name), '[^a-zA-Z0-9\s-]', '', 'g'))
      ELSE split_part(lower(email), '@', 1)
    END AS seed
  FROM users
), normalized AS (
  SELECT
    id,
    COALESCE(NULLIF(regexp_replace(seed, '[\s_-]+', '-', 'g'), ''), 'user') AS base_slug
  FROM base
), ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM normalized
)
UPDATE users u
SET slug = CASE WHEN r.rn = 1 THEN r.base_slug ELSE r.base_slug || '-' || r.rn END
FROM ranked r
WHERE u.id = r.id
  AND (u.slug IS NULL OR TRIM(u.slug) = '');

-- Ensure no nulls remain
UPDATE users SET slug = 'user-' || id WHERE slug IS NULL OR TRIM(slug) = '';

ALTER TABLE users ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug_unique ON users(slug);
