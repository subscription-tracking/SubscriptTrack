-- Atomic paid renewal. Deploy separately, after checking every pending migration.
-- The existing payment and subscription RPCs remain available to older clients.
ALTER TABLE public.subscription_events ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.confirm_subscription_renewal_idempotent(
  p_idempotency_key text,
  p_subscription_id uuid,
  p_expected_old_date date,
  p_next_date date,
  p_today date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.subscriptions%ROWTYPE;
  v_existing public.idempotency_keys%ROWTYPE;
  v_hash text;
  v_path text := '/subscriptions/' || p_subscription_id::text || '/confirm-renewal';
  v_payment jsonb;
  v_event jsonb;
  v_body jsonb;
  v_timezone text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 OR
     p_subscription_id IS NULL OR p_expected_old_date IS NULL OR p_next_date IS NULL OR p_today IS NULL THEN
    RAISE EXCEPTION 'invalid renewal input' USING ERRCODE = '22023';
  END IF;
  v_hash := encode(digest(concat_ws('|', p_subscription_id::text,
    p_expected_old_date::text, p_next_date::text, p_today::text), 'sha256'), 'hex');

  -- Serializes concurrent attempts on the same subscription before the key lookup.
  SELECT * INTO v_row FROM public.subscriptions
    WHERE id = p_subscription_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id = v_user AND method = 'POST' AND path = v_path
      AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;

  SELECT timezone INTO v_timezone FROM public.profiles WHERE user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002'; END IF;

  -- Existing keys return their original result even when the calendar day advanced.
  -- IANA-local today can be one civil day either side of UTC today.
  IF p_today < (now() AT TIME ZONE 'UTC')::date - 1 OR
     p_today > (now() AT TIME ZONE 'UTC')::date + 1 OR p_next_date <= p_today OR
     p_next_date <= p_expected_old_date THEN
    RAISE EXCEPTION 'invalid renewal dates' USING ERRCODE = '22023';
  END IF;
  IF p_today IS DISTINCT FROM (now() AT TIME ZONE v_timezone)::date THEN
    RAISE EXCEPTION 'local date changed' USING ERRCODE = 'P0001';
  END IF;

  IF v_row.status <> 'active' OR v_row.next_renewal_date IS DISTINCT FROM p_expected_old_date
     OR p_expected_old_date > p_today THEN
    RAISE EXCEPTION 'renewal state changed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES (v_user, p_subscription_id, v_row.amount, v_row.currency, now(), 'manual')
    RETURNING to_jsonb(payment_events.*) INTO v_payment;

  UPDATE public.subscriptions SET next_renewal_date = p_next_date
    WHERE id = p_subscription_id AND user_id = v_user
    RETURNING * INTO v_row;

  INSERT INTO public.subscription_events(user_id, subscription_id, event_type, payload)
    VALUES (v_user, p_subscription_id, 'RENEWAL_ADVANCED',
      jsonb_build_object('from_date', p_expected_old_date, 'to_date', p_next_date))
    RETURNING to_jsonb(subscription_events.*) INTO v_event;

  v_body := jsonb_build_object('subscription', to_jsonb(v_row), 'payment', v_payment, 'event', v_event);
  INSERT INTO public.idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', v_path, p_idempotency_key, v_hash, 200, v_body);
  RETURN v_body;
END; $$;

REVOKE ALL ON FUNCTION public.confirm_subscription_renewal_idempotent(text, uuid, date, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_subscription_renewal_idempotent(text, uuid, date, date, date) TO authenticated;
