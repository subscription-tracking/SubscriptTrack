-- 034: Yetki daraltma ve kullanıcı başına satır kotaları (güvenlik denetimi F-07, F-30, F-31).
--
-- 1) `anon` rolü hiçbir tabloya yazamaz; `authenticated` TRUNCATE/REFERENCES/TRIGGER
--    yetkisi taşımaz. RLS zaten sahipliği korur; bu katman "derinlemesine savunma"dır
--    ve ileride yanlışlıkla RLS'siz eklenen bir tabloyu da kapsar (varsayılan yetkiler dahil).
--    `service_role` etkilenmez. SELECT yetkileri (örn. service_catalog herkese açık okuma)
--    korunur; `authenticated` için INSERT/UPDATE/DELETE korunur (uygulama notifications,
--    payment_events, savings_events, subscriptions tablolarına RLS altında yazar).
-- 2) Kullanıcı başına satır üst sınırı: sınırsız büyüme (depolama/maliyet) engellenir.
--    Tetikleyiciler yalnızca INSERT'te çalışır; mevcut verileri etkilemez. Bildirim üreten
--    pg_cron işi kasıtlı olarak kotasızdır (üretici toplu yazımı kota nedeniyle kırılmasın).
-- 3) Kullanılmayan `device_tokens` kaldırılır (uzak push/FCM kullanılmaz; yabancı anahtarı
--    CASCADE olmadığı için satır olsaydı hesap silmeyi engellerdi).
--
-- Geri alma (yorum olarak):
--   GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;   -- önerilmez
--   DROP TRIGGER trg_quota_<tablo> ON public.<tablo>; DROP FUNCTION public.enforce_row_quota();
--
-- Bu migration repoda yazılmıştır; canlıda UYGULANMAMIŞTIR.

-- ─── 1) Yetkiler ──────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;

-- ─── 2) Kotalar ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_row_quota()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer := TG_ARGV[0]::integer;
  v_count bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I.%I WHERE user_id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO v_count USING NEW.user_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'quota_exceeded: % kayıt sınırına ulaşıldı (%)', TG_TABLE_NAME, v_limit
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_row_quota() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_quota_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_quota_subscriptions BEFORE INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_quota(500);

DROP TRIGGER IF EXISTS trg_quota_support_tickets ON public.support_tickets;
CREATE TRIGGER trg_quota_support_tickets BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_quota(100);

DROP TRIGGER IF EXISTS trg_quota_exports ON public.exports;
CREATE TRIGGER trg_quota_exports BEFORE INSERT ON public.exports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_quota(200);

DROP TRIGGER IF EXISTS trg_quota_payment_events ON public.payment_events;
CREATE TRIGGER trg_quota_payment_events BEFORE INSERT ON public.payment_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_quota(50000);

DROP TRIGGER IF EXISTS trg_quota_savings_events ON public.savings_events;
CREATE TRIGGER trg_quota_savings_events BEFORE INSERT ON public.savings_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_quota(10000);

-- ─── 3) Kullanılmayan tablo ───────────────────────────────────────
DROP TABLE IF EXISTS public.device_tokens;

-- ─── 4) Dışa aktarma kovası sınırları (F-02) ──────────────────────
-- Kova özeldir; yalnızca CSV ve en çok 5 MB kabul eder.
UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['text/csv']
 WHERE id = 'exports';
