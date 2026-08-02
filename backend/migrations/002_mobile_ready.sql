-- SubscriptTrack — Migration 002: Mobile-ready schema
-- Bu migration 001_initial_schema.sql'in karmaşık şemasını
-- Flutter client'ının doğrudan kullandığı basit yapıya dönüştürür.
--
-- ÇALIŞTIRMA SIRASI:
--   Supabase Dashboard > SQL Editor'a yapıştırarak çalıştır.
--   001 daha önce çalıştırıldıysa ek tablolar (billing_schedules vb.)
--   yerinde kalır, zarar vermez.
-- ─────────────────────────────────────────────────────────────────

-- ─── AUTH TRIGGER — her auth.users kaydına otomatik user_id üret ─

-- NOT: Subscription'lar artık auth.users(id)'ye doğrudan referans verir.
-- Ayrı bir "users" proxy tablosuna gerek yoktur.

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency          CHAR(3)     NOT NULL DEFAULT 'TRY',
  billing_cycle     TEXT        NOT NULL DEFAULT 'monthly'
                      CHECK (billing_cycle IN ('weekly','monthly','quarterly','yearly')),
  start_date        DATE        NOT NULL,
  next_renewal_date DATE        NOT NULL,
  category          TEXT        NOT NULL DEFAULT 'other'
                      CHECK (category IN (
                        'streaming','music','gaming','software',
                        'cloud','fitness','news','food','education','other'
                      )),
  notes             TEXT        CHECK (char_length(notes) <= 2000),
  status            TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','cancelled','archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Okuma indeksleri
CREATE INDEX IF NOT EXISTS idx_subs_user_status
  ON public.subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subs_user_renewal
  ON public.subscriptions(user_id, next_renewal_date);

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Önceki politikaları temizle (idempotent çalıştırma için)
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

-- ─── STORAGE BUCKET (opsiyonel — export dosyaları için) ───────────
-- Supabase Dashboard > Storage > New bucket > "exports" (private)
-- Bu SQL'de oluşturulamaz; dashboard'dan manuel oluştur.

-- ─── NOTLAR ───────────────────────────────────────────────────────
-- 1. Supabase Dashboard > Authentication > URL Configuration >
--    Redirect URLs'e şunu ekle: subscripttrack://auth-callback
--
-- 2. E-posta şablonlarını Türkçe'ye çevirmek için:
--    Dashboard > Authentication > Email Templates
--
-- 3. Hesap silme için delete-account Edge Function'ı deploy et:
--    backend/supabase/functions/delete-account/index.ts
