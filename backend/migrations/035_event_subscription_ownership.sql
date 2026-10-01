-- 035: Olay tablolarının başkasının aboneliğine bağlanmasını engelle (güvenlik denetimi F-25).
--
-- `payment_events`, `subscription_events`, `notifications` satırlarındaki
-- `subscription_id`, satırın `user_id` sahibine ait bir abonelik olmalıdır.
-- RLS yalnızca `user_id = auth.uid()` denetler; başka kullanıcının abonelik UUID'si
-- bilinirse (tahmini pratikte imkânsız) bağlanabilirdi.
--
-- Tetikleyici SECURITY INVOKER çalışır: istemci rolü yalnızca kendi aboneliklerini
-- görebildiği için yabancı kimlik "yok" sayılıp reddedilir. service_role / tablo
-- sahibi (pg_cron üreticisi, SECURITY DEFINER RPC'ler) RLS'i atladığından tüm
-- abonelikleri görür; üretici zaten doğru sahibe yazar.
--
-- İSTEĞE BAĞLI ve düşük öncelikli; repoda yazılmıştır, canlıda UYGULANMAMIŞTIR.
-- Geri alma: DROP TRIGGER trg_owner_<tablo> ON public.<tablo>; DROP FUNCTION public.enforce_subscription_owner();

CREATE OR REPLACE FUNCTION public.enforce_subscription_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.subscription_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
     WHERE s.id = NEW.subscription_id AND s.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'subscription_owner_mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_subscription_owner() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['payment_events', 'subscription_events', 'notifications'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_owner_%1$s ON public.%1$I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_owner_%1$s BEFORE INSERT OR UPDATE OF subscription_id, user_id ON public.%1$I
           FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_owner()', t);
    END IF;
  END LOOP;
END;
$$;
