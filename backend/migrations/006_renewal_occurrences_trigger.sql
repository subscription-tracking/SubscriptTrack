-- 006: renewal_occurrences auto-population
-- Fixes two bugs that made the pg_cron notification producer a no-op:
--   1. renewal_occurrences was never written to (no trigger existed)
--   2. pg_cron filtered status='pending' but rows store 'PENDING' (case mismatch)
--
-- Changes:
--   A. Trigger on subscriptions → maintains renewal_occurrences on insert/update
--   B. Backfill: creates PENDING occurrences for all existing active subscriptions
--   C. Replaces pg_cron job with corrected status case and clean JSONB insert

-- ── A. Trigger ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_renewal_occurrence()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Cancelled or archived: mark future PENDING occurrences as CANCELLED
  IF TG_OP = 'UPDATE' AND NEW.status IN ('cancelled', 'archived') THEN
    UPDATE renewal_occurrences
    SET    status = 'CANCELLED'
    WHERE  subscription_id = NEW.id
      AND  status          = 'PENDING'
      AND  scheduled_at    > NOW();
    RETURN NEW;
  END IF;

  -- Active subscriptions only
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- On update: skip if nothing renewal-relevant changed
  IF TG_OP = 'UPDATE'
     AND OLD.next_renewal_date = NEW.next_renewal_date
     AND OLD.amount            = NEW.amount
     AND OLD.currency          = NEW.currency
  THEN
    RETURN NEW;
  END IF;

  -- Remove stale future PENDING occurrences for this subscription
  DELETE FROM renewal_occurrences
  WHERE  subscription_id = NEW.id
    AND  status          = 'PENDING'
    AND  scheduled_at    > NOW();

  -- Insert the next renewal occurrence
  INSERT INTO renewal_occurrences (
    id, subscription_id, user_id,
    type, scheduled_at, expected_amount, currency, status
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.user_id,
    'RENEWAL',
    NEW.next_renewal_date::TIMESTAMPTZ,
    NEW.amount::TEXT,
    NEW.currency,
    'PENDING'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_renewal_occurrence ON public.subscriptions;
CREATE TRIGGER trg_sync_renewal_occurrence
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_renewal_occurrence();

-- ── B. Backfill existing active subscriptions ─────────────────────────────────

INSERT INTO renewal_occurrences (
  id, subscription_id, user_id,
  type, scheduled_at, expected_amount, currency, status
)
SELECT
  gen_random_uuid(),
  s.id,
  s.user_id,
  'RENEWAL',
  s.next_renewal_date::TIMESTAMPTZ,
  s.amount::TEXT,
  s.currency,
  'PENDING'
FROM public.subscriptions s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM renewal_occurrences ro
    WHERE  ro.subscription_id  = s.id
      AND  ro.status           = 'PENDING'
      AND  ro.scheduled_at::date = s.next_renewal_date
  );

-- ── C. Recreate pg_cron job with corrected status case ────────────────────────
-- Previous job filtered status='pending' (lowercase) but rows store 'PENDING'.
-- Also removes the unnecessary ::text cast on body_params (column is JSONB).

SELECT cron.unschedule('notification-producer');

SELECT cron.schedule(
  'notification-producer',
  '0 * * * *',
  $$
  INSERT INTO notifications (
    id, user_id, subscription_id, occurrence_id,
    type, title_key, body_params, deep_link, created_at
  )
  SELECT
    gen_random_uuid(),
    ro.user_id,
    ro.subscription_id,
    ro.id,
    CASE
      WHEN ro.scheduled_at::date = CURRENT_DATE       THEN 'renewal_today'
      WHEN ro.scheduled_at::date <= CURRENT_DATE + 3  THEN 'renewal_soon'
      ELSE                                                 'renewal_upcoming'
    END,
    CASE
      WHEN ro.scheduled_at::date = CURRENT_DATE       THEN 'renewal_today'
      WHEN ro.scheduled_at::date <= CURRENT_DATE + 3  THEN 'renewal_soon'
      ELSE                                                 'renewal_upcoming'
    END,
    jsonb_build_object(
      'name',     s.name,
      'days',     (ro.scheduled_at::date - CURRENT_DATE),
      'amount',   ro.expected_amount,
      'currency', ro.currency
    ),
    '/subscriptions/' || ro.subscription_id::text,
    NOW()
  FROM renewal_occurrences ro
  JOIN subscriptions s ON s.id = ro.subscription_id
  WHERE ro.status = 'PENDING'
    AND ro.scheduled_at::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
    AND s.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.occurrence_id = ro.id
        AND n.type = CASE
          WHEN ro.scheduled_at::date = CURRENT_DATE       THEN 'renewal_today'
          WHEN ro.scheduled_at::date <= CURRENT_DATE + 3  THEN 'renewal_soon'
          ELSE                                                 'renewal_upcoming'
        END
    );
  $$
);
