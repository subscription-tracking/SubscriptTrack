-- Forward-only fix: preserve the 037 signature and serialize concurrent retries.
-- Idempotent deferred first payment. Mirrors record_payment_idempotent (026) but writes
-- status = 'DEFERRED' with deferred_until, so the client no longer needs a direct table
-- insert that bypasses the idempotency key table. Deferred rows are excluded from the
-- partial unique index (013, WHERE status = 'PAID'), so they never conflict with paid rows.
-- Additive: record_payment_idempotent and older clients are unchanged.

CREATE OR REPLACE FUNCTION public.record_deferred_payment_idempotent(
  p_idempotency_key text,
  p_subscription_id uuid,
  p_amount numeric,
  p_currency text,
  p_paid_at timestamptz,
  p_deferred_until date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.idempotency_keys%ROWTYPE;
  v_body jsonb;
  v_path text := '/payment-events/deferred';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 OR p_deferred_until IS NULL THEN
    RAISE EXCEPTION 'invalid deferred payment input' USING ERRCODE = '22023';
  END IF;
  -- Same user/path/key is serialized before the result lookup and payment write.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text || v_path || p_idempotency_key, 37));
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE id = p_subscription_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002';
  END IF;

  v_hash := encode(digest(concat_ws('|', p_subscription_id, p_amount::text, p_currency,
    p_paid_at::text, p_deferred_until::text), 'sha256'), 'hex');

  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id = v_user AND method = 'POST' AND path = v_path
      AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;

  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source, status, deferred_until)
    VALUES (v_user, p_subscription_id, p_amount, p_currency, p_paid_at, 'manual', 'DEFERRED', p_deferred_until)
    RETURNING to_jsonb(payment_events.*) INTO v_body;

  INSERT INTO public.idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', v_path, p_idempotency_key, v_hash, 201, v_body);
  RETURN v_body;
END; $$;

REVOKE ALL ON FUNCTION public.record_deferred_payment_idempotent(text, uuid, numeric, text, timestamptz, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_deferred_payment_idempotent(text, uuid, numeric, text, timestamptz, date) TO authenticated;
