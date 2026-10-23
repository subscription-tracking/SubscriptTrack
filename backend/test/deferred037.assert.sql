\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

CREATE FUNCTION public.test_deferred(
  key text, sub uuid, amount numeric, deferred_until date
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.record_deferred_payment_idempotent(key, sub, amount, 'TRY', '2026-10-12T09:00:00Z', deferred_until)
$$;

DO $$
DECLARE
  v_sub uuid := '10000000-0000-0000-0000-000000000001';
  v_foreign uuid := '10000000-0000-0000-0000-000000000002';
  v_first jsonb;
  v_second jsonb;
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.record_deferred_payment_idempotent(text,uuid,numeric,text,timestamptz,date)', 'EXECUTE') OR
     has_function_privilege('anon', 'public.record_deferred_payment_idempotent(text,uuid,numeric,text,timestamptz,date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC grants are incorrect';
  END IF;

  -- Foreign subscription, missing deferred date and unauthenticated caller never write.
  BEGIN
    PERFORM public.test_deferred('foreign-test-key', v_foreign, 49.90, '2026-10-20');
    RAISE EXCEPTION 'foreign subscription was accepted';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
  BEGIN
    PERFORM public.test_deferred('short', v_sub, 49.90, '2026-10-20');
    RAISE EXCEPTION 'short key was accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  BEGIN
    PERFORM public.test_deferred('null-date-key', v_sub, 49.90, NULL);
    RAISE EXCEPTION 'null deferred date was accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '', false);
  BEGIN
    PERFORM public.test_deferred('anon-test-key', v_sub, 49.90, '2026-10-20');
    RAISE EXCEPTION 'anonymous caller was accepted';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
  IF (SELECT count(*) FROM public.payment_events) <> 0 THEN RAISE EXCEPTION 'rejected requests wrote payments'; END IF;

  -- Same key twice returns the stored response and writes exactly one DEFERRED row.
  v_first := public.test_deferred('same-deferred-key', v_sub, 49.90, '2026-10-20');
  v_second := public.test_deferred('same-deferred-key', v_sub, 49.90, '2026-10-20');
  IF v_first IS DISTINCT FROM v_second THEN RAISE EXCEPTION 'same key returned different result'; END IF;
  IF v_first->>'status' <> 'DEFERRED' OR v_first->>'deferred_until' <> '2026-10-20' THEN
    RAISE EXCEPTION 'response is not a deferred payment';
  END IF;
  IF (SELECT count(*) FROM public.payment_events WHERE subscription_id = v_sub AND status = 'DEFERRED') <> 1 THEN
    RAISE EXCEPTION 'retry duplicated the deferred payment';
  END IF;

  -- Reusing the key with a different payload is rejected and writes nothing.
  BEGIN
    PERFORM public.test_deferred('same-deferred-key', v_sub, 59.90, '2026-10-20');
    RAISE EXCEPTION 'key reuse with different payload was accepted';
  EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;

  -- A deferred row never conflicts with a PAID row for the same subscription and instant.
  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES ('00000000-0000-0000-0000-000000000001', v_sub, 49.90, 'TRY', '2026-10-12T09:00:00Z', 'manual');
  IF (SELECT count(*) FROM public.payment_events WHERE subscription_id = v_sub) <> 2 THEN
    RAISE EXCEPTION 'deferred row blocked a paid row';
  END IF;
END $$;

SELECT 'deferred037 assertions passed' AS result;
