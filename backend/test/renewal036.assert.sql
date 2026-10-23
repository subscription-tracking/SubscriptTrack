\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

CREATE FUNCTION public.test_renewal(
  key text, sub uuid, old_date date, next_date date, today date
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.confirm_subscription_renewal_idempotent(key, sub, old_date, next_date, today)
$$;

DO $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Europe/Istanbul')::date;
  v_sub uuid := '10000000-0000-0000-0000-000000000001';
  v_first jsonb;
  v_second jsonb;
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.confirm_subscription_renewal_idempotent(text,uuid,date,date,date)', 'EXECUTE') OR
     has_function_privilege('anon', 'public.confirm_subscription_renewal_idempotent(text,uuid,date,date,date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC grants are incorrect';
  END IF;
  -- Wrong owner, stale expected date and unauthenticated caller never write.
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
  BEGIN
    PERFORM public.test_renewal('owner-test-key', v_sub, v_today - 1, v_today + 1, v_today);
    RAISE EXCEPTION 'foreign owner was accepted';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '', false);
  BEGIN
    PERFORM public.test_renewal('anon-test-key', v_sub, v_today - 1, v_today + 1, v_today);
    RAISE EXCEPTION 'anonymous caller was accepted';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
  BEGIN
    PERFORM public.test_renewal('stale-test-key', v_sub, v_today - 2, v_today + 1, v_today);
    RAISE EXCEPTION 'stale date was accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  BEGIN
    PERFORM public.test_renewal('today-test-key', v_sub, v_today - 1, v_today + 1, v_today - 1);
    RAISE EXCEPTION 'wrong IANA day was accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE '22023' THEN NULL; END;
  IF (SELECT count(*) FROM public.payment_events) <> 0 THEN RAISE EXCEPTION 'failed requests wrote payments'; END IF;

  v_first := public.test_renewal('same-test-key', v_sub, v_today - 1, v_today + 1, v_today);
  v_second := public.test_renewal('same-test-key', v_sub, v_today - 1, v_today + 1, v_today);
  IF v_first IS DISTINCT FROM v_second THEN RAISE EXCEPTION 'same key returned different result'; END IF;
  IF (SELECT count(*) FROM public.payment_events WHERE subscription_id = v_sub) <> 1 OR
     (SELECT count(*) FROM public.subscription_events WHERE subscription_id = v_sub) <> 1 OR
     (SELECT count(*) FROM public.idempotency_keys WHERE path LIKE '%confirm-renewal') <> 1 OR
     (SELECT next_renewal_date FROM public.subscriptions WHERE id = v_sub) <> v_today + 1 THEN
    RAISE EXCEPTION 'successful renewal did not commit exactly once';
  END IF;
  BEGIN
    PERFORM public.test_renewal('same-test-key', v_sub, v_today - 1, v_today + 2, v_today);
    RAISE EXCEPTION 'key reuse with different payload was accepted';
  EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
END $$;

-- Inject a failure after each write and verify that every prior write rolls back.
CREATE FUNCTION public.test_fail_renewal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('test.fail_at', true) = TG_TABLE_NAME THEN
    RAISE EXCEPTION 'injected failure at %', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fail_payment BEFORE INSERT ON public.payment_events FOR EACH ROW EXECUTE FUNCTION public.test_fail_renewal();
CREATE TRIGGER fail_subscription BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.test_fail_renewal();
CREATE TRIGGER fail_event BEFORE INSERT ON public.subscription_events FOR EACH ROW EXECUTE FUNCTION public.test_fail_renewal();
CREATE TRIGGER fail_key BEFORE INSERT ON public.idempotency_keys FOR EACH ROW EXECUTE FUNCTION public.test_fail_renewal();

DO $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Europe/Istanbul')::date;
  v_stage text;
  v_sub uuid := '10000000-0000-0000-0000-000000000002';
BEGIN
  FOREACH v_stage IN ARRAY ARRAY['payment_events','subscriptions','subscription_events','idempotency_keys'] LOOP
    PERFORM set_config('test.fail_at', v_stage, false);
    BEGIN
      PERFORM public.test_renewal('rollback-' || v_stage, v_sub, v_today - 1, v_today + 1, v_today);
      RAISE EXCEPTION 'failure was not injected at %', v_stage;
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM NOT LIKE 'injected failure at %' THEN RAISE; END IF;
    END;
    IF (SELECT count(*) FROM public.payment_events WHERE subscription_id = v_sub) <> 0 OR
       (SELECT count(*) FROM public.subscription_events WHERE subscription_id = v_sub) <> 0 OR
       (SELECT count(*) FROM public.idempotency_keys WHERE path LIKE '%' || v_sub::text || '%') <> 0 OR
       (SELECT next_renewal_date FROM public.subscriptions WHERE id = v_sub) <> v_today - 1 THEN
      RAISE EXCEPTION 'rollback incomplete after %', v_stage;
    END IF;
  END LOOP;
  PERFORM set_config('test.fail_at', '', false);
END $$;

SELECT 'renewal036 sequential and rollback assertions passed' AS result;
