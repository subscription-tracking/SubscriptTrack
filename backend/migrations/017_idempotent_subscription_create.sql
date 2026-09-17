-- 017: Idempotent subscription create for direct mobile Supabase clients.
ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS request_hash text;

CREATE OR REPLACE FUNCTION public.create_subscription_idempotent(
  p_idempotency_key text,
  p_name text,
  p_amount numeric,
  p_currency text,
  p_billing_cycle text,
  p_start_date date,
  p_next_renewal_date date,
  p_category text,
  p_notes text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_trial_end_date date DEFAULT NULL,
  p_trial_price_after numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.idempotency_keys%ROWTYPE;
  v_row public.subscriptions%ROWTYPE;
  v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE = '22023';
  END IF;
  v_hash := encode(digest(concat_ws('|',p_name,p_amount::text,p_currency,p_billing_cycle,p_start_date::text,p_next_renewal_date::text,p_category,coalesce(p_notes,''),coalesce(p_payment_method,''),coalesce(p_trial_end_date::text,''),coalesce(p_trial_price_after::text,'')), 'sha256'), 'hex');
  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id=v_user AND method='POST' AND path='/subscriptions' AND idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;
  INSERT INTO public.subscriptions
    (user_id,name,amount,currency,billing_cycle,start_date,next_renewal_date,category,notes,payment_method,trial_end_date,trial_price_after,status)
  VALUES
    (v_user,trim(p_name),p_amount,p_currency,p_billing_cycle,p_start_date,p_next_renewal_date,p_category,p_notes,p_payment_method,p_trial_end_date,p_trial_price_after,
     CASE WHEN p_trial_end_date IS NULL THEN 'active' ELSE 'trial' END)
  RETURNING * INTO v_row;
  v_body := to_jsonb(v_row);
  INSERT INTO public.idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body)
    VALUES(v_user,'POST','/subscriptions',p_idempotency_key,v_hash,201,v_body);
  RETURN v_body;
END;
$$;

REVOKE ALL ON FUNCTION public.create_subscription_idempotent(text,text,numeric,text,text,date,date,text,text,text,date,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_subscription_idempotent(text,text,numeric,text,text,date,date,text,text,text,date,numeric) TO authenticated;
