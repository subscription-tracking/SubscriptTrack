\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;

CREATE TABLE public.profiles (user_id uuid PRIMARY KEY, timezone text NOT NULL);
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY, user_id uuid NOT NULL, amount numeric(12,2) NOT NULL,
  currency char(3) NOT NULL, status text NOT NULL, next_renewal_date date NOT NULL
);
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  subscription_id uuid NOT NULL, amount numeric(12,2) NOT NULL, currency char(3) NOT NULL,
  paid_at timestamptz NOT NULL, source text NOT NULL
);
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  subscription_id uuid NOT NULL, event_type text NOT NULL
);
CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  method text NOT NULL, path text NOT NULL, idempotency_key text NOT NULL,
  request_hash text, status integer, response_body jsonb,
  UNIQUE (user_id, method, path, idempotency_key)
);

INSERT INTO public.profiles VALUES
  ('00000000-0000-0000-0000-000000000001', 'Europe/Istanbul'),
  ('00000000-0000-0000-0000-000000000002', 'Europe/Istanbul');
INSERT INTO public.subscriptions VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 49.90, 'TRY', 'active', (now() AT TIME ZONE 'Europe/Istanbul')::date - 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 20.00, 'TRY', 'active', (now() AT TIME ZONE 'Europe/Istanbul')::date - 1),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 30.00, 'TRY', 'active', (now() AT TIME ZONE 'Europe/Istanbul')::date - 1);
