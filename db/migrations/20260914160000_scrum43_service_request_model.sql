-- SCRUM-43: Align service_requests with MVP AC fields.
-- Adds title, category, related_asset_object_id; backfills from legacy columns.
-- Legacy related_*_object_id columns remain nullable (deprecated).
-- Idempotent. Apply after 20240207000000_complete_setup.sql (+ RLS as needed).

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS related_asset_object_id UUID;

-- Backfill from legacy shape: type → category, description → title,
-- first non-null related_* → related_asset_object_id.
UPDATE public.service_requests
SET
  category = COALESCE(NULLIF(BTRIM(category), ''), NULLIF(BTRIM(type), ''), 'General'),
  title = COALESCE(
    NULLIF(BTRIM(title), ''),
    NULLIF(LEFT(BTRIM(description), 200), ''),
    'Service request'
  ),
  related_asset_object_id = COALESCE(
    related_asset_object_id,
    related_equipment_object_id,
    related_item_object_id,
    related_vendor_object_id
  )
WHERE category IS NULL
   OR title IS NULL
   OR (
     related_asset_object_id IS NULL
     AND COALESCE(
       related_equipment_object_id,
       related_item_object_id,
       related_vendor_object_id
     ) IS NOT NULL
   );

ALTER TABLE public.service_requests
  ALTER COLUMN title SET DEFAULT 'Service request',
  ALTER COLUMN category SET DEFAULT 'General';

UPDATE public.service_requests
SET
  title = COALESCE(NULLIF(BTRIM(title), ''), 'Service request'),
  category = COALESCE(NULLIF(BTRIM(category), ''), 'General')
WHERE title IS NULL OR category IS NULL;

ALTER TABLE public.service_requests
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN category SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_requests_related_asset_object_id_fkey'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_related_asset_object_id_fkey
      FOREIGN KEY (related_asset_object_id)
      REFERENCES public.objects(object_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_requests_related_asset
  ON public.service_requests(related_asset_object_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_category
  ON public.service_requests(workspace_id, category);

CREATE INDEX IF NOT EXISTS idx_service_requests_priority
  ON public.service_requests(workspace_id, priority);

COMMENT ON COLUMN public.service_requests.title IS 'SCRUM-43: short request title (AC)';
COMMENT ON COLUMN public.service_requests.category IS 'SCRUM-43: request category (AC); supersedes type for new writes';
COMMENT ON COLUMN public.service_requests.related_asset_object_id IS 'SCRUM-43: primary related asset FK (AC)';
COMMENT ON COLUMN public.service_requests.related_item_object_id IS 'Deprecated: prefer related_asset_object_id';
COMMENT ON COLUMN public.service_requests.related_equipment_object_id IS 'Deprecated: prefer related_asset_object_id';
COMMENT ON COLUMN public.service_requests.related_vendor_object_id IS 'Deprecated: prefer related_asset_object_id';
