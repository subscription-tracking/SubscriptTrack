-- 016: Live notification pipeline. Idempotent for an existing deployment.

CREATE OR REPLACE FUNCTION public.sync_renewal_occurrence()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IN ('cancelled', 'archived') THEN
    UPDATE public.renewal_occurrences SET status = 'CANCELLED'
    WHERE subscription_id = NEW.id AND status = 'PENDING' AND scheduled_at > NOW();
    RETURN NEW;
  END IF;
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE'
     AND OLD.next_renewal_date = NEW.next_renewal_date
     AND OLD.amount = NEW.amount
     AND OLD.currency = NEW.currency THEN RETURN NEW; END IF;
  DELETE FROM public.renewal_occurrences
  WHERE subscription_id = NEW.id AND status = 'PENDING' AND scheduled_at > NOW();
  INSERT INTO public.renewal_occurrences
    (subscription_id,user_id,type,scheduled_at,expected_amount,currency,status)
  VALUES
    (NEW.id,NEW.user_id,'RENEWAL',NEW.next_renewal_date::timestamptz,
     NEW.amount::text,NEW.currency,'PENDING');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_renewal_occurrence ON public.subscriptions;
CREATE TRIGGER trg_sync_renewal_occurrence
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_renewal_occurrence();

INSERT INTO public.renewal_occurrences
  (subscription_id,user_id,type,scheduled_at,expected_amount,currency,status)
SELECT s.id,s.user_id,'RENEWAL',s.next_renewal_date::timestamptz,
       s.amount::text,s.currency,'PENDING'
FROM public.subscriptions s
WHERE s.status = 'active' AND s.next_renewal_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.renewal_occurrences r
    WHERE r.subscription_id=s.id AND r.status='PENDING'
      AND r.scheduled_at::date=s.next_renewal_date
  );

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='notification-producer') THEN
    PERFORM cron.schedule(
  'notification-producer', '0 * * * *',
  $job$INSERT INTO public.notifications
    (user_id,subscription_id,occurrence_id,type,title_key,body_params,deep_link)
  SELECT ro.user_id,ro.subscription_id,ro.id,
    CASE WHEN ro.scheduled_at::date=CURRENT_DATE THEN 'renewal_today'
         WHEN ro.scheduled_at::date<=CURRENT_DATE+3 THEN 'renewal_soon'
         ELSE 'renewal_upcoming' END,
    CASE WHEN ro.scheduled_at::date=CURRENT_DATE THEN 'renewal_today'
         WHEN ro.scheduled_at::date<=CURRENT_DATE+3 THEN 'renewal_soon'
         ELSE 'renewal_upcoming' END,
    jsonb_build_object('name',s.name,'days',(ro.scheduled_at::date-CURRENT_DATE),
                       'amount',ro.expected_amount,'currency',ro.currency),
    '/subscriptions/'||ro.subscription_id::text
  FROM public.renewal_occurrences ro
  JOIN public.subscriptions s ON s.id=ro.subscription_id
  WHERE ro.status='PENDING'
    AND ro.scheduled_at::date BETWEEN CURRENT_DATE AND CURRENT_DATE+7
    AND s.status='active'
    AND NOT EXISTS (SELECT 1 FROM public.notifications n
      WHERE n.occurrence_id=ro.id AND n.type=CASE
        WHEN ro.scheduled_at::date=CURRENT_DATE THEN 'renewal_today'
        WHEN ro.scheduled_at::date<=CURRENT_DATE+3 THEN 'renewal_soon'
        ELSE 'renewal_upcoming' END);$job$
    );
  END IF;
END $do$;
