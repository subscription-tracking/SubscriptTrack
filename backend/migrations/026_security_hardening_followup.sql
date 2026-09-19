-- 026: Security hardening follow-up from a static audit of 001-025.
--
-- Fixes, in order:
--  1) record_payment_idempotent (018) never verified that p_subscription_id
--     belongs to the caller before inserting a payment_events row for it.
--     An authenticated user could attach a fabricated payment to another
--     user's subscription. Adds the same ownership check already used by
--     the sibling update_subscription_idempotent function.
--  2) idempotency_keys was created twice with incompatible schemas (004:
--     cache_key/status_code, no user_id; 015: user_id/method/path/
--     idempotency_key). Because 015 uses CREATE TABLE IF NOT EXISTS, an
--     environment where 004 ran first keeps the old schema and every RPC
--     added in 017+ (which all read/write user_id/method/path/
--     idempotency_key/request_hash) fails at call time. Reconciles the
--     table additively (no destructive drops) so the schema matches the
--     015 design regardless of history, then (re)asserts RLS + policy.
--  3) billing_schedules has RLS enabled (001/009) but no policy anywhere,
--     making it fully inaccessible via PostgREST. Applies the ownership
--     policy already reviewed and documented in
--     SubscriptTrack-Documentation/database/rls_policies.sql (scoped via
--     the owning subscription's user_id), guarded so it is a no-op where
--     the table doesn't exist.
--  4) categories/services (001) have no RLS and were never explicitly
--     granted/revoked, relying on Postgres/Supabase default grants for
--     public-schema tables. They are shared reference data with no
--     dedicated owner column, so RLS doesn't apply — instead this
--     explicitly revokes write access from anon/authenticated and leaves
--     read access, removing any dependency on default-grant behavior.

-- ── 1) record_payment_idempotent: enforce subscription ownership ──────────

CREATE OR REPLACE FUNCTION public.record_payment_idempotent(
  p_idempotency_key text, p_subscription_id uuid, p_amount numeric,
  p_currency text, p_paid_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_user uuid := auth.uid(); v_hash text; v_existing idempotency_keys%ROWTYPE; v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE id = p_subscription_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002';
  END IF;
  v_hash := encode(digest(concat_ws('|', p_subscription_id, p_amount::text, p_currency, p_paid_at::text), 'sha256'), 'hex');
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id = v_user AND method = 'POST' AND path = '/payment-events' AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;
  INSERT INTO payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES (v_user, p_subscription_id, p_amount, p_currency, p_paid_at, 'manual')
    RETURNING to_jsonb(payment_events.*) INTO v_body;
  INSERT INTO idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', '/payment-events', p_idempotency_key, v_hash, 201, v_body);
  RETURN v_body;
END; $$;

REVOKE ALL ON FUNCTION public.record_payment_idempotent(text, uuid, numeric, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_idempotent(text, uuid, numeric, text, timestamptz) TO authenticated;

-- ── 2) idempotency_keys: reconcile 004-vs-015 schema drift (additive) ─────

ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS path text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS request_hash text,
  ADD COLUMN IF NOT EXISTS status integer,
  ADD COLUMN IF NOT EXISTS response_body jsonb,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill the legacy status_code column into status where the old (004)
-- schema is present and a row hasn't been touched by the new RPCs yet.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'idempotency_keys' AND column_name = 'status_code') THEN
    EXECUTE 'UPDATE public.idempotency_keys SET status = status_code WHERE status IS NULL AND status_code IS NOT NULL';
  END IF;
END $$;

-- Old (004) rows predate per-user idempotency and can never satisfy the
-- user_id-scoped RLS policy or the 017+ RPCs' WHERE clauses; they are a
-- 24h-expiry cache with no other reader, so they're simply stale.
DELETE FROM public.idempotency_keys WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_keys_user_method_path_key
  ON public.idempotency_keys (user_id, method, path, idempotency_key);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_idempotency_keys ON public.idempotency_keys;
CREATE POLICY own_idempotency_keys ON public.idempotency_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3) billing_schedules: apply the reviewed ownership policy ─────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'billing_schedules') THEN

    ALTER TABLE public.billing_schedules ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "billing_schedules: select own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: insert own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: update own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: delete own" ON public.billing_schedules;

    CREATE POLICY "billing_schedules: select own"
      ON public.billing_schedules FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = billing_schedules.subscription_id AND s.user_id = auth.uid()
      ));

    CREATE POLICY "billing_schedules: insert own"
      ON public.billing_schedules FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = billing_schedules.subscription_id AND s.user_id = auth.uid()
      ));

    CREATE POLICY "billing_schedules: update own"
      ON public.billing_schedules FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = billing_schedules.subscription_id AND s.user_id = auth.uid()
      ));

    CREATE POLICY "billing_schedules: delete own"
      ON public.billing_schedules FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = billing_schedules.subscription_id AND s.user_id = auth.uid()
      ));

  END IF;
END $$;

-- ── 4) categories/services: explicit read-only grants (no default-grant reliance) ──

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'categories') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.categories FROM authenticated, anon;
    GRANT SELECT ON public.categories TO authenticated, anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'services') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.services FROM authenticated, anon;
    GRANT SELECT ON public.services TO authenticated, anon;
  END IF;
END $$;
