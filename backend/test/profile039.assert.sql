\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
INSERT INTO subscriptions(id,user_id,amount,currency,status,next_renewal_date) VALUES
('20000000-0000-0000-0000-000000000005',auth.uid(),10,'USD','active',(now() AT TIME ZONE 'Pacific/Kiritimati')::date-1);
DO $$
DECLARE today date := (now() AT TIME ZONE 'Pacific/Kiritimati')::date; result jsonb;
BEGIN
  BEGIN
    PERFORM confirm_subscription_renewal_in_timezone_idempotent('invalid-iana-key','20000000-0000-0000-0000-000000000005',today-1,today+1,today,'bad/zone');
    RAISE EXCEPTION 'invalid IANA accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  BEGIN
    PERFORM confirm_subscription_renewal_in_timezone_idempotent('wrong-zone-day','20000000-0000-0000-0000-000000000005',today-1,today+1,today-1,'Pacific/Kiritimati');
    RAISE EXCEPTION 'wrong device day accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  result := confirm_subscription_renewal_in_timezone_idempotent('device-zone-renewal','20000000-0000-0000-0000-000000000005',today-1,today+1,today,'Pacific/Kiritimati');
  IF result IS DISTINCT FROM confirm_subscription_renewal_in_timezone_idempotent('device-zone-renewal','20000000-0000-0000-0000-000000000005',today-1,today+1,today,'Pacific/Kiritimati') THEN RAISE EXCEPTION 'device replay differs'; END IF;
  IF (SELECT count(*) FROM payment_events WHERE subscription_id='20000000-0000-0000-0000-000000000005') <> 1 THEN RAISE EXCEPTION 'device payment count'; END IF;
END $$;
