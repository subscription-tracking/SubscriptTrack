-- 007: savings_events table + RLS
-- Creates the table if it didn't exist (projects that skipped migration 001).
-- Projects that ran 001 already have it; the IF NOT EXISTS guards are safe to re-run.

CREATE TABLE IF NOT EXISTS savings_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL CHECK (event_type IN ('CANCELLED', 'PAUSED')),
  monthly_amount   NUMERIC(12,2) NOT NULL,
  annual_amount    NUMERIC(12,2) NOT NULL,
  currency         CHAR(3)     NOT NULL,
  effective_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_events_user
  ON savings_events (user_id, effective_at DESC);

ALTER TABLE savings_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'savings_events'
      AND policyname = 'users_own_savings_events'
  ) THEN
    CREATE POLICY users_own_savings_events
      ON savings_events FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;
