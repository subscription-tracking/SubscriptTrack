-- 032: Edge Function'lar için kullanıcı başına uygulama düzeyinde hız sınırı.
--
-- Güvenlik taramasında 4/4 Edge Function'da hız sınırı yoktu (destek kaydı
-- spam'i, hesap silme/dışa aktarma denemeleri). Sayaç burada tutulur;
-- `backend/supabase/functions/_shared/ratelimit.js` çağırır.
--
-- Tasarım:
--  * Sabit pencere: (user_id, bucket) başına tek satır; pencere dolunca sayaç 1'e döner.
--  * Yalnızca service_role erişir (Edge Function'ın admin istemcisi). Tablo RLS'li ve
--    politikasızdır: istemci (anon/authenticated) hiçbir şey okuyamaz ya da yazamaz.
--  * Auth kullanıcısı silinince satırlar cascade ile temizlenir.
--
-- Bu migration repoda yazılmıştır; canlıda UYGULANMAMIŞTIR (bkz. docs/reference/SUPABASE_LIVE_STATUS.md).

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        integer     NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.rate_limits IS
  'Edge Function hız sınırı sayaçları; yalnızca service_role erişir (RLS açık, politika yok).';

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_user_id IS NULL OR p_bucket IS NULL OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rate_limits AS r (user_id, bucket, window_start, count)
  VALUES (p_user_id, p_bucket, now(), 1)
  ON CONFLICT (user_id, bucket) DO UPDATE SET
    window_start = CASE
      WHEN r.window_start <= now() - make_interval(secs => p_window_seconds) THEN now()
      ELSE r.window_start END,
    count = CASE
      WHEN r.window_start <= now() - make_interval(secs => p_window_seconds) THEN 1
      ELSE r.count + 1 END
  RETURNING r.count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

-- Yalnızca service_role çağırabilir (anon/authenticated/PUBLIC açıkça geri alınır).
REVOKE ALL ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;
