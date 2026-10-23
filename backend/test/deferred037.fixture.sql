\set ON_ERROR_STOP on
-- Minimal schema for migration 037. Mirrors the columns and partial unique index from 013.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY, user_id uuid NOT NULL
);
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  subscription_id uuid NOT NULL, amount numeric(12,2) NOT NULL, currency char(3) NOT NULL,
  paid_at timestamptz NOT NULL, source text NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'UNPAID', 'DEFERRED', 'SKIPPED')),
  deferred_until DATE
);
CREATE UNIQUE INDEX payment_events_subscription_paid_at_idx
  ON public.payment_events (subscription_id, paid_at) WHERE status = 'PAID';
CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  method text NOT NULL, path text NOT NULL, idempotency_key text NOT NULL,
  request_hash text, status integer, response_body jsonb,
  UNIQUE (user_id, method, path, idempotency_key)
);

INSERT INTO public.subscriptions VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');
