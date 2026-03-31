-- Add slug column for SEO-friendly and shareable task URLs
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Backfill slugs for existing rows (handles duplicate titles)
WITH base_slugs AS (
    SELECT
        id,
        COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(title, 'task')), '[^a-z0-9]+', '-', 'g')), ''), 'task') AS base_slug
    FROM tasks
),
ranked_slugs AS (
    SELECT
        id,
        base_slug,
        ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS slug_rank
    FROM base_slugs
)
UPDATE tasks t
SET slug = CASE
    WHEN rs.slug_rank = 1 THEN rs.base_slug
    ELSE rs.base_slug || '-' || rs.slug_rank
END
FROM ranked_slugs rs
WHERE t.id = rs.id
  AND (t.slug IS NULL OR t.slug = '');

ALTER TABLE tasks
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_slug ON tasks(slug);
