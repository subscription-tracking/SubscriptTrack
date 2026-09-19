-- 018: Idempotent update/status/payment mutations for direct mobile clients.
CREATE OR REPLACE FUNCTION public.update_subscription_idempotent(
  p_idempotency_key text, p_subscription_id uuid, p_name text, p_amount numeric,
  p_currency text, p_billing_cycle text, p_next_renewal_date date,
  p_category text, p_notes text, p_payment_method text, p_trial_end_date date,
  p_trial_price_after numeric, p_notification_rules jsonb, p_status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_user uuid := auth.uid(); v_hash text; v_existing idempotency_keys%ROWTYPE; v_row subscriptions%ROWTYPE; v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE='22023'; END IF;
  v_hash := encode(digest(concat_ws('|',p_subscription_id,p_name,p_amount::text,p_currency,p_billing_cycle,p_next_renewal_date::text,p_category,coalesce(p_notes,''),coalesce(p_payment_method,''),coalesce(p_trial_end_date::text,''),coalesce(p_trial_price_after::text,''),p_notification_rules::text,p_status),'sha256'),'hex');
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id=v_user AND method='PATCH' AND path='/subscriptions/'||p_subscription_id::text AND idempotency_key=p_idempotency_key;
  IF FOUND THEN IF v_existing.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE='23505'; END IF; RETURN v_existing.response_body; END IF;
  UPDATE subscriptions SET name=trim(p_name),amount=p_amount,currency=p_currency,billing_cycle=p_billing_cycle,next_renewal_date=p_next_renewal_date,category=p_category,notes=p_notes,payment_method=p_payment_method,trial_end_date=p_trial_end_date,trial_price_after=p_trial_price_after,notification_rules=coalesce(p_notification_rules,'[]'::jsonb),status=p_status WHERE id=p_subscription_id AND user_id=v_user RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE='P0002'; END IF;
  v_body:=to_jsonb(v_row); INSERT INTO idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body) VALUES(v_user,'PATCH','/subscriptions/'||p_subscription_id::text,p_idempotency_key,v_hash,200,v_body); RETURN v_body;
END; $$;

CREATE OR REPLACE FUNCTION public.record_payment_idempotent(p_idempotency_key text,p_subscription_id uuid,p_amount numeric,p_currency text,p_paid_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, extensions AS $$
DECLARE v_user uuid:=auth.uid(); v_hash text; v_existing idempotency_keys%ROWTYPE; v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  v_hash:=encode(digest(concat_ws('|',p_subscription_id,p_amount::text,p_currency,p_paid_at::text),'sha256'),'hex');
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id=v_user AND method='POST' AND path='/payment-events' AND idempotency_key=p_idempotency_key;
  IF FOUND THEN IF v_existing.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE='23505'; END IF; RETURN v_existing.response_body; END IF;
  INSERT INTO payment_events(user_id,subscription_id,amount,currency,paid_at,source) VALUES(v_user,p_subscription_id,p_amount,p_currency,p_paid_at,'manual') RETURNING to_jsonb(payment_events.*) INTO v_body;
  INSERT INTO idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body) VALUES(v_user,'POST','/payment-events',p_idempotency_key,v_hash,201,v_body); RETURN v_body;
END; $$;
REVOKE ALL ON FUNCTION public.update_subscription_idempotent(text,uuid,text,numeric,text,text,date,text,text,text,date,numeric,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_subscription_idempotent(text,uuid,text,numeric,text,text,date,text,text,text,date,numeric,jsonb,text) TO authenticated;
REVOKE ALL ON FUNCTION public.record_payment_idempotent(text,uuid,numeric,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_idempotent(text,uuid,numeric,text,timestamptz) TO authenticated;
