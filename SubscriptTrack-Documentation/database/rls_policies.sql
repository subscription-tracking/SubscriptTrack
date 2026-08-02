-- SubscriptTrack — Tam RLS Politikaları
-- 002_mobile_ready.sql'den sonra çalıştır (veya birlikte çalıştır — idempotent).
-- Mobil client anon key kullanır; service_role key asla client'a verilmez.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── subscriptions ───────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions: select own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: insert own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: update own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: delete own" ON public.subscriptions;

CREATE POLICY "subscriptions: select own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions: insert own"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions: update own"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions: delete own"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── profiles (001 şemasında varsa) ─────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "profiles: select own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;

    CREATE POLICY "profiles: select own"
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "profiles: insert own"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "profiles: update own"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = user_id);

  END IF;
END $$;

-- ─── billing_schedules (001 şemasında varsa) ─────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'billing_schedules') THEN

    ALTER TABLE public.billing_schedules ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "billing_schedules: select own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: insert own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: update own" ON public.billing_schedules;
    DROP POLICY IF EXISTS "billing_schedules: delete own" ON public.billing_schedules;

    CREATE POLICY "billing_schedules: select own"
      ON public.billing_schedules FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.id = billing_schedules.subscription_id
            AND s.user_id = auth.uid()
        )
      );

    CREATE POLICY "billing_schedules: insert own"
      ON public.billing_schedules FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.id = billing_schedules.subscription_id
            AND s.user_id = auth.uid()
        )
      );

    CREATE POLICY "billing_schedules: update own"
      ON public.billing_schedules FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.id = billing_schedules.subscription_id
            AND s.user_id = auth.uid()
        )
      );

    CREATE POLICY "billing_schedules: delete own"
      ON public.billing_schedules FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.id = billing_schedules.subscription_id
            AND s.user_id = auth.uid()
        )
      );

  END IF;
END $$;

-- ─── notifications (001 şemasında varsa) ─────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'notifications') THEN

    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "notifications: select own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;

    CREATE POLICY "notifications: select own"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "notifications: update own"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);

  END IF;
END $$;

-- ─── device_tokens (001 şemasında varsa) ─────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'device_tokens') THEN

    ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "device_tokens: select own" ON public.device_tokens;
    DROP POLICY IF EXISTS "device_tokens: insert own" ON public.device_tokens;
    DROP POLICY IF EXISTS "device_tokens: delete own" ON public.device_tokens;

    CREATE POLICY "device_tokens: select own"
      ON public.device_tokens FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "device_tokens: insert own"
      ON public.device_tokens FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "device_tokens: delete own"
      ON public.device_tokens FOR DELETE
      USING (auth.uid() = user_id);

  END IF;
END $$;

-- ─── exports (001 şemasında varsa) ───────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'exports') THEN

    ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "exports: select own" ON public.exports;

    CREATE POLICY "exports: select own"
      ON public.exports FOR SELECT
      USING (auth.uid() = user_id);

  END IF;
END $$;

-- ─── Secret scan kontrol listesi ─────────────────────────────────────────────
-- [ ] SUPABASE_URL        → --dart-define, kaynak kodda yok
-- [ ] SUPABASE_ANON_KEY   → --dart-define, kaynak kodda yok
-- [ ] API_BASE_URL        → --dart-define, kaynak kodda yok
-- [ ] service_role key    → sadece Edge Function ortam değişkeni
-- [ ] JWT secret          → Supabase yönetiminde, kaynak kodda asla yok
