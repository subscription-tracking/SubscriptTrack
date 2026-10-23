\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$
DECLARE ids uuid[] := ARRAY['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002']::uuid[]; first jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
  BEGIN
    PERFORM public.soft_delete_subscriptions_idempotent('foreign-owner-key',ids);
    RAISE EXCEPTION 'ownership was not checked';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub','',false);
  BEGIN
    PERFORM public.soft_delete_subscriptions_idempotent('anonymous-delete',ids);
    RAISE EXCEPTION 'anonymous delete accepted';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
  -- The fixture's injected failure checks both row updates and cached result insertion.
  PERFORM set_config('test.fail_at','idempotency_keys',false);
  BEGIN
    PERFORM public.soft_delete_subscriptions_idempotent('delete-rollback-key',ids);
    RAISE EXCEPTION 'failure not injected';
  EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'injected failure%' THEN RAISE; END IF; END;
  IF EXISTS(SELECT 1 FROM subscriptions WHERE id=ANY(ids) AND deleted_at IS NOT NULL) THEN RAISE EXCEPTION 'delete failed rollback'; END IF;
  PERFORM set_config('test.fail_at','',false);
  first := public.soft_delete_subscriptions_idempotent('delete-repeat-key',ids);
  IF first IS DISTINCT FROM public.soft_delete_subscriptions_idempotent('delete-repeat-key',ARRAY[ids[2],ids[1],ids[1]]) THEN RAISE EXCEPTION 'canonical repeat failed'; END IF;
  BEGIN
    PERFORM public.soft_delete_subscriptions_idempotent('delete-repeat-key',ARRAY[ids[1]]);
    RAISE EXCEPTION 'different payload accepted';
  EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
  IF (SELECT count(*) FROM subscriptions WHERE id=ANY(ids) AND deleted_at IS NOT NULL) <> 2 THEN RAISE EXCEPTION 'bulk delete incomplete'; END IF;
  IF (SELECT count(*) FROM payment_events WHERE subscription_id=ids[1]) <> 1 OR (SELECT count(*) FROM savings_events WHERE subscription_id=ids[1]) <> 1 THEN RAISE EXCEPTION 'financial history changed'; END IF;
  BEGIN
    UPDATE subscriptions SET status='active' WHERE id=ids[1];
    RAISE EXCEPTION 'deleted subscription resurrected';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
  BEGIN
    INSERT INTO payment_events(user_id,subscription_id,amount,currency,paid_at,source) VALUES(auth.uid(),ids[1],99,'TRY',now(),'manual');
    RAISE EXCEPTION 'payment on deleted subscription accepted';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
END $$;
SET ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM subscriptions WHERE deleted_at IS NOT NULL) THEN RAISE EXCEPTION 'deleted subscription visible'; END IF;
  IF (SELECT count(*) FROM payment_events) <> 1 OR (SELECT count(*) FROM savings_events) <> 1 THEN RAISE EXCEPTION 'history hidden by RLS'; END IF;
END $$;
RESET ROLE;
-- Deleted rows release quota; nondeleted archived rows still consume it.
INSERT INTO subscriptions(id,user_id,amount,currency,status,next_renewal_date)
SELECT gen_random_uuid(),'00000000-0000-0000-0000-000000000003',1,'EUR','active',current_date FROM generate_series(1,1000);
DO $$ BEGIN
  BEGIN
    INSERT INTO subscriptions(id,user_id,amount,currency,status,next_renewal_date) VALUES(gen_random_uuid(),'00000000-0000-0000-0000-000000000003',1,'EUR','active',current_date);
    RAISE EXCEPTION '1001 accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT '038 ownership, idempotency, rollback, history, RLS, quota passed' AS result;
