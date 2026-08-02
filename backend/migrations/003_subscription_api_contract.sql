-- Align the backend subscription record with the mobile REST contract.
-- Safe for existing deployments: backfill from the creation date before
-- enforcing the non-null requirement.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

UPDATE subscriptions
SET start_date = created_at
WHERE start_date IS NULL;

ALTER TABLE subscriptions
  ALTER COLUMN start_date SET NOT NULL;

INSERT INTO categories (code, display_name_key, icon_key, sort_order)
VALUES
  ('NEWS', 'category.news', 'newspaper', 10),
  ('FOOD', 'category.food', 'utensils', 11)
ON CONFLICT (code) DO NOTHING;
