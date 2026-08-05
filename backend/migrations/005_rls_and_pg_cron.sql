-- 005: RLS policies (all user tables) + pg_cron notification producer
-- Idempotent: IF NOT EXISTS / DO $$ guards throughout.

-- ── pg_cron ────────────────────────────────────────────────────────────────────
-- Enable on Supabase: Dashboard → Database → Extensions → pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── RLS policies ───────────────────────────────────────────────────────────────

-- users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_own_row') THEN
    CREATE POLICY users_own_row ON users FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='users_own_profile') THEN
    CREATE POLICY users_own_profile ON profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- subscriptions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='users_own_subscriptions') THEN
    CREATE POLICY users_own_subscriptions ON subscriptions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- renewal_occurrences
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='renewal_occurrences' AND policyname='users_own_occurrences') THEN
    CREATE POLICY users_own_occurrences ON renewal_occurrences FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='users_own_notifications') THEN
    CREATE POLICY users_own_notifications ON notifications FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- device_tokens
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='device_tokens' AND policyname='users_own_device_tokens') THEN
    CREATE POLICY users_own_device_tokens ON device_tokens FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- savings_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_events' AND policyname='users_own_savings_events') THEN
    CREATE POLICY users_own_savings_events ON savings_events FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- subscription_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_events' AND policyname='users_own_sub_events') THEN
    CREATE POLICY users_own_sub_events ON subscription_events FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── pg_cron: hourly notification producer ─────────────────────────────────────
-- Replaces notification_worker.js. Runs inside the DB — no external process needed.
-- Dedup key: one notification per (occurrence_id, type).

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
      WHEN ro.scheduled_at::date = CURRENT_DATE         THEN 'renewal_today'
      WHEN ro.scheduled_at::date <= CURRENT_DATE + 3   THEN 'renewal_soon'
      ELSE 'renewal_upcoming'
    END,
    CASE
      WHEN ro.scheduled_at::date = CURRENT_DATE         THEN 'renewal_today'
      WHEN ro.scheduled_at::date <= CURRENT_DATE + 3   THEN 'renewal_soon'
      ELSE 'renewal_upcoming'
    END,
    jsonb_build_object(
      'name',     s.name,
      'days',     (ro.scheduled_at::date - CURRENT_DATE),
      'amount',   ro.expected_amount,
      'currency', ro.currency
    )::text,
    '/subscriptions/' || ro.subscription_id::text,
    NOW()
  FROM renewal_occurrences ro
  JOIN subscriptions s ON s.id = ro.subscription_id
  WHERE ro.status = 'pending'
    AND ro.scheduled_at::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
    AND s.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.occurrence_id = ro.id
        AND n.type = CASE
          WHEN ro.scheduled_at::date = CURRENT_DATE       THEN 'renewal_today'
          WHEN ro.scheduled_at::date <= CURRENT_DATE + 3 THEN 'renewal_soon'
          ELSE 'renewal_upcoming'
        END
    );
  $$
);
