-- Forward migration; deploy only after separate review/approval.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS subscriptions_visible_owner_idx ON public.subscriptions(user_id)
  WHERE deleted_at IS NULL;

-- Older clients cannot read or mutate hidden subscriptions. History stays owner-scoped.
DROP POLICY IF EXISTS subscriptions_visible ON public.subscriptions;
CREATE POLICY subscriptions_visible ON public.subscriptions AS RESTRICTIVE
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.guard_deleted_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'subscription deleted' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_deleted_subscription ON public.subscriptions;
CREATE TRIGGER guard_deleted_subscription BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_deleted_subscription();

CREATE OR REPLACE FUNCTION public.soft_delete_subscriptions_idempotent(
  p_idempotency_key text, p_subscription_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_hash text;
  v_existing public.idempotency_keys%ROWTYPE;
  v_body jsonb;
  v_path text := '/subscriptions/soft-delete';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8
    OR cardinality(p_subscription_ids) IS NULL OR cardinality(p_subscription_ids) NOT BETWEEN 1 AND 1000
    OR array_position(p_subscription_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'invalid delete input' USING ERRCODE='22023';
  END IF;
  SELECT array_agg(id ORDER BY id) INTO v_ids FROM (SELECT DISTINCT unnest(p_subscription_ids) id) s;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 038));
  v_hash := encode(digest(array_to_string(v_ids, ','), 'sha256'),'hex');
  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id=v_user AND method='POST' AND path=v_path AND idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused' USING ERRCODE='23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;
  PERFORM id FROM public.subscriptions WHERE user_id=v_user AND id=ANY(v_ids) ORDER BY id FOR UPDATE;
  IF (SELECT count(*) FROM public.subscriptions WHERE user_id=v_user AND id=ANY(v_ids)) <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'subscription not found' USING ERRCODE='P0002';
  END IF;
  -- Cancelled/archive flags stop the existing occurrence producer, including older jobs.
  -- Financial history is deliberately not deleted or recalculated.
  UPDATE public.subscriptions SET deleted_at=now(), status='cancelled', is_archived=true
    WHERE user_id=v_user AND id=ANY(v_ids) AND deleted_at IS NULL;
  v_body := jsonb_build_object('deleted_ids',to_jsonb(v_ids));
  INSERT INTO public.idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body)
    VALUES(v_user,'POST',v_path,p_idempotency_key,v_hash,200,v_body);
  RETURN v_body;
END; $$;
REVOKE ALL ON FUNCTION public.soft_delete_subscriptions_idempotent(text,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_subscriptions_idempotent(text,uuid[]) TO authenticated;
REVOKE ALL ON FUNCTION public.guard_deleted_subscription() FROM PUBLIC,anon,authenticated;

-- Payment/create-event writes must not resurrect a removed subscription.
CREATE OR REPLACE FUNCTION public.guard_deleted_subscription_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.subscription_id IS NOT NULL THEN
    PERFORM id FROM public.subscriptions WHERE id=NEW.subscription_id AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE='P0002'; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_deleted_reference ON public.payment_events;
CREATE TRIGGER guard_deleted_reference BEFORE INSERT ON public.payment_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_deleted_subscription_reference();
DROP TRIGGER IF EXISTS guard_deleted_reference ON public.subscription_events;
CREATE TRIGGER guard_deleted_reference BEFORE INSERT ON public.subscription_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_deleted_subscription_reference();
REVOKE ALL ON FUNCTION public.guard_deleted_subscription_reference() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.enforce_subscription_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,038));
  IF (SELECT count(*) FROM public.subscriptions WHERE user_id=NEW.user_id AND deleted_at IS NULL) >= 1000 THEN
    RAISE EXCEPTION 'quota_exceeded: subscriptions (1000)' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_quota_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_quota_subscriptions BEFORE INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_quota();
REVOKE ALL ON FUNCTION public.enforce_subscription_quota() FROM PUBLIC,anon,authenticated;
