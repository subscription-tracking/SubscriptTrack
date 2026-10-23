-- Data-free public schema baseline, inspected from Supabase on 2026-10-22.
-- EMPTY DATABASE ONLY. Auth/Storage, extensions, cron and Realtime are platform prerequisites.
-- Historical backend/migrations files remain history, not a clean-install chain.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- tables
CREATE TABLE public.exports (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, status text DEFAULT 'PENDING'::text NOT NULL, storage_path text, expires_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL, download_url text, error_message text);
CREATE TABLE public.idempotency_keys (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, method text NOT NULL, path text NOT NULL, idempotency_key text NOT NULL, status integer, response_body jsonb, expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, request_hash text);
CREATE TABLE public.notification_deliveries (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, notification_id uuid, channel text NOT NULL, status text DEFAULT 'PENDING'::text NOT NULL, delivered_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.notification_rules (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, subscription_id uuid, days_before smallint NOT NULL, enabled boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.notifications (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, subscription_id uuid, occurrence_id uuid, type text NOT NULL, title_key text NOT NULL, body_params jsonb DEFAULT '{}'::jsonb NOT NULL, deep_link text, read_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.payment_events (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, subscription_id uuid, amount numeric(12,2) NOT NULL, currency character(3) NOT NULL, paid_at timestamp with time zone NOT NULL, source text DEFAULT 'manual'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, status text DEFAULT 'PAID'::text NOT NULL, deferred_until date);
CREATE TABLE public.payment_methods (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, name text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.profiles (user_id uuid NOT NULL, first_name text, last_name text, preferred_currency character(3) DEFAULT 'TRY'::bpchar NOT NULL, timezone text DEFAULT 'Europe/Istanbul'::text NOT NULL, locale text DEFAULT 'tr-TR'::text NOT NULL, theme text DEFAULT 'SYSTEM'::text NOT NULL, default_notify_days smallint DEFAULT 3 NOT NULL, push_enabled boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, timezone_mode text DEFAULT 'device'::text NOT NULL);
CREATE TABLE public.rate_limits (user_id uuid NOT NULL, bucket text NOT NULL, window_start timestamp with time zone DEFAULT now() NOT NULL, count integer DEFAULT 1 NOT NULL);
CREATE TABLE public.renewal_occurrences (id uuid DEFAULT gen_random_uuid() NOT NULL, subscription_id uuid NOT NULL, user_id uuid NOT NULL, type text DEFAULT 'RENEWAL'::text NOT NULL, scheduled_at timestamp with time zone NOT NULL, expected_amount text NOT NULL, currency character(3) NOT NULL, status text DEFAULT 'PENDING'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.savings_events (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, subscription_id uuid, event_type text NOT NULL, monthly_amount numeric DEFAULT 0 NOT NULL, annual_amount numeric DEFAULT 0 NOT NULL, currency character(3) DEFAULT 'TRY'::bpchar NOT NULL, effective_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.service_catalog (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, category text DEFAULT 'other'::text NOT NULL, is_active boolean DEFAULT true NOT NULL, sort_order integer DEFAULT 0 NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.subscription_events (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, subscription_id uuid, event_type text NOT NULL, payload jsonb DEFAULT '{}'::jsonb NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.subscriptions (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, name text NOT NULL, amount numeric(12,2) NOT NULL, currency text DEFAULT 'TRY'::text NOT NULL, billing_cycle text DEFAULT 'monthly'::text NOT NULL, category text DEFAULT 'other'::text NOT NULL, start_date date DEFAULT CURRENT_DATE NOT NULL, next_renewal_date date, color integer, logo_url text, website text, notes text, is_archived boolean DEFAULT false NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, status text DEFAULT 'active'::text NOT NULL, payment_method text, trial_end_date date, trial_price_after numeric(19,4), notification_rules jsonb DEFAULT '[{"enabled": true, "daysBefore": 3}]'::jsonb NOT NULL, deleted_at timestamp with time zone);
CREATE TABLE public.support_tickets (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, category text DEFAULT 'general'::text NOT NULL, message text NOT NULL, status text DEFAULT 'open'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);

-- constraints
ALTER TABLE public.exports ADD CONSTRAINT exports_pkey PRIMARY KEY (id);
ALTER TABLE public.idempotency_keys ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);
ALTER TABLE public.idempotency_keys ADD CONSTRAINT idempotency_keys_user_id_method_path_idempotency_key_key UNIQUE (user_id, method, path, idempotency_key);
ALTER TABLE public.notification_deliveries ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_rules ADD CONSTRAINT notification_rules_days_before_check CHECK (((days_before >= 0) AND (days_before <= 30)));
ALTER TABLE public.notification_rules ADD CONSTRAINT notification_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_amount_check CHECK ((amount >= (0)::numeric));
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'renewal'::text, 'import'::text])));
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_status_check CHECK ((status = ANY (ARRAY['PAID'::text, 'UNPAID'::text, 'DEFERRED'::text, 'SKIPPED'::text])));
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_name_check CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 80)));
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_timezone_mode_check CHECK ((timezone_mode = ANY (ARRAY['device'::text, 'fixed'::text])));
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (user_id, bucket);
ALTER TABLE public.renewal_occurrences ADD CONSTRAINT renewal_occurrences_pkey PRIMARY KEY (id);
ALTER TABLE public.savings_events ADD CONSTRAINT savings_events_pkey PRIMARY KEY (id);
ALTER TABLE public.service_catalog ADD CONSTRAINT service_catalog_name_key UNIQUE (name);
ALTER TABLE public.service_catalog ADD CONSTRAINT service_catalog_pkey PRIMARY KEY (id);
ALTER TABLE public.subscription_events ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_amount_range CHECK (((amount >= (0)::numeric) AND (amount <= (1000000000)::numeric)));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_cycle_allowed CHECK ((billing_cycle = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_category_allowed CHECK ((category = ANY (ARRAY['streaming'::text, 'music'::text, 'gaming'::text, 'software'::text, 'cloud'::text, 'fitness'::text, 'news'::text, 'food'::text, 'education'::text, 'other'::text])));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_currency_format CHECK ((currency ~ '^[A-Z]{3}$'::text));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 160)));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_notes_length CHECK (((notes IS NULL) OR (char_length(notes) <= 2000)));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_notification_rules_size CHECK ((pg_column_size(notification_rules) <= 4096));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_payment_method_length CHECK (((payment_method IS NULL) OR (char_length(payment_method) <= 80)));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_allowed CHECK ((status = ANY (ARRAY['trial'::text, 'active'::text, 'paused'::text, 'cancelled'::text, 'expired'::text, 'archived'::text])));
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_message_check CHECK (((length(TRIM(BOTH FROM message)) >= 1) AND (length(TRIM(BOTH FROM message)) <= 2000)));
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])));
ALTER TABLE public.exports ADD CONSTRAINT exports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.idempotency_keys ADD CONSTRAINT idempotency_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notification_deliveries ADD CONSTRAINT notification_deliveries_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE;
ALTER TABLE public.notification_deliveries ADD CONSTRAINT notification_deliveries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notification_rules ADD CONSTRAINT notification_rules_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.notification_rules ADD CONSTRAINT notification_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES renewal_occurrences(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.renewal_occurrences ADD CONSTRAINT renewal_occurrences_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.renewal_occurrences ADD CONSTRAINT renewal_occurrences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.savings_events ADD CONSTRAINT savings_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.savings_events ADD CONSTRAINT savings_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_events ADD CONSTRAINT subscription_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.subscription_events ADD CONSTRAINT subscription_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);
CREATE INDEX idx_subscriptions_next_renewal ON public.subscriptions USING btree (next_renewal_date);
CREATE INDEX idx_occurrences_user_scheduled ON public.renewal_occurrences USING btree (user_id, scheduled_at);
CREATE UNIQUE INDEX payment_events_subscription_paid_at_idx ON public.payment_events USING btree (subscription_id, paid_at) WHERE (status = 'PAID'::text);
CREATE INDEX idx_payment_events_user_date ON public.payment_events USING btree (user_id, paid_at DESC);
CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX idx_savings_events_user_date ON public.savings_events USING btree (user_id, effective_at DESC);
CREATE INDEX subscriptions_visible_owner_idx ON public.subscriptions USING btree (user_id) WHERE (deleted_at IS NULL);

-- functions
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_bucket text, p_limit integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.confirm_subscription_renewal_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_row public.subscriptions%ROWTYPE;
  v_existing public.idempotency_keys%ROWTYPE;
  v_hash text;
  v_path text := '/subscriptions/' || p_subscription_id::text || '/confirm-renewal';
  v_payment jsonb;
  v_event jsonb;
  v_body jsonb;
  v_timezone text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 OR
     p_subscription_id IS NULL OR p_expected_old_date IS NULL OR p_next_date IS NULL OR p_today IS NULL THEN
    RAISE EXCEPTION 'invalid renewal input' USING ERRCODE = '22023';
  END IF;
  v_hash := encode(digest(concat_ws('|', p_subscription_id::text,
    p_expected_old_date::text, p_next_date::text, p_today::text), 'sha256'), 'hex');

  -- Serializes concurrent attempts on the same subscription before the key lookup.
  SELECT * INTO v_row FROM public.subscriptions
    WHERE id = p_subscription_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id = v_user AND method = 'POST' AND path = v_path
      AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;

  SELECT timezone INTO v_timezone FROM public.profiles WHERE user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002'; END IF;

  -- Existing keys return their original result even when the calendar day advanced.
  -- IANA-local today can be one civil day either side of UTC today.
  IF p_today < (now() AT TIME ZONE 'UTC')::date - 1 OR
     p_today > (now() AT TIME ZONE 'UTC')::date + 1 OR p_next_date <= p_today OR
     p_next_date <= p_expected_old_date THEN
    RAISE EXCEPTION 'invalid renewal dates' USING ERRCODE = '22023';
  END IF;
  IF p_today IS DISTINCT FROM (now() AT TIME ZONE v_timezone)::date THEN
    RAISE EXCEPTION 'local date changed' USING ERRCODE = 'P0001';
  END IF;

  IF v_row.status <> 'active' OR v_row.next_renewal_date IS DISTINCT FROM p_expected_old_date
     OR p_expected_old_date > p_today THEN
    RAISE EXCEPTION 'renewal state changed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES (v_user, p_subscription_id, v_row.amount, v_row.currency, now(), 'manual')
    RETURNING to_jsonb(payment_events.*) INTO v_payment;

  UPDATE public.subscriptions SET next_renewal_date = p_next_date
    WHERE id = p_subscription_id AND user_id = v_user
    RETURNING * INTO v_row;

  INSERT INTO public.subscription_events(user_id, subscription_id, event_type, payload)
    VALUES (v_user, p_subscription_id, 'RENEWAL_ADVANCED',
      jsonb_build_object('from_date', p_expected_old_date, 'to_date', p_next_date))
    RETURNING to_jsonb(subscription_events.*) INTO v_event;

  v_body := jsonb_build_object('subscription', to_jsonb(v_row), 'payment', v_payment, 'event', v_event);
  INSERT INTO public.idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', v_path, p_idempotency_key, v_hash, 200, v_body);
  RETURN v_body;
END; $function$;

CREATE OR REPLACE FUNCTION public.confirm_subscription_renewal_in_timezone_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date, p_timezone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_row public.subscriptions%ROWTYPE;
  v_existing public.idempotency_keys%ROWTYPE;
  v_hash text;
  v_path text := '/subscriptions/' || p_subscription_id::text || '/confirm-renewal';
  v_payment jsonb;
  v_event jsonb;
  v_body jsonb;
  v_timezone text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 OR
     p_subscription_id IS NULL OR p_expected_old_date IS NULL OR p_next_date IS NULL OR p_today IS NULL THEN
    RAISE EXCEPTION 'invalid renewal input' USING ERRCODE = '22023';
  END IF;
  v_hash := encode(digest(concat_ws('|', p_subscription_id::text,
    p_expected_old_date::text, p_next_date::text, p_today::text, p_timezone), 'sha256'), 'hex');

  -- Serializes concurrent attempts on the same subscription before the key lookup.
  SELECT * INTO v_row FROM public.subscriptions
    WHERE id = p_subscription_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND OR v_row.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id = v_user AND method = 'POST' AND path = v_path
      AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;

  SELECT CASE WHEN timezone_mode = 'device' THEN p_timezone ELSE timezone END INTO v_timezone FROM public.profiles WHERE user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002'; END IF;

  IF v_timezone IS NULL OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name=v_timezone) THEN
    RAISE EXCEPTION 'invalid IANA timezone' USING ERRCODE='22023';
  END IF;

  -- Existing keys return their original result even when the calendar day advanced.
  -- IANA-local today can be one civil day either side of UTC today.
  IF p_today < (now() AT TIME ZONE 'UTC')::date - 1 OR
     p_today > (now() AT TIME ZONE 'UTC')::date + 1 OR p_next_date <= p_today OR
     p_next_date <= p_expected_old_date THEN
    RAISE EXCEPTION 'invalid renewal dates' USING ERRCODE = '22023';
  END IF;
  IF p_today IS DISTINCT FROM (now() AT TIME ZONE v_timezone)::date THEN
    RAISE EXCEPTION 'local date changed' USING ERRCODE = 'P0001';
  END IF;

  IF v_row.status <> 'active' OR v_row.next_renewal_date IS DISTINCT FROM p_expected_old_date
     OR p_expected_old_date > p_today THEN
    RAISE EXCEPTION 'renewal state changed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES (v_user, p_subscription_id, v_row.amount, v_row.currency, now(), 'manual')
    RETURNING to_jsonb(payment_events.*) INTO v_payment;

  UPDATE public.subscriptions SET next_renewal_date = p_next_date
    WHERE id = p_subscription_id AND user_id = v_user
    RETURNING * INTO v_row;

  INSERT INTO public.subscription_events(user_id, subscription_id, event_type, payload)
    VALUES (v_user, p_subscription_id, 'RENEWAL_ADVANCED',
      jsonb_build_object('from_date', p_expected_old_date, 'to_date', p_next_date))
    RETURNING to_jsonb(subscription_events.*) INTO v_event;

  v_body := jsonb_build_object('subscription', to_jsonb(v_row), 'payment', v_payment, 'event', v_event);
  INSERT INTO public.idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', v_path, p_idempotency_key, v_hash, 200, v_body);
  RETURN v_body;
END; $function$;

CREATE OR REPLACE FUNCTION public.create_subscription_idempotent(p_idempotency_key text, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text DEFAULT NULL::text, p_payment_method text DEFAULT NULL::text, p_trial_end_date date DEFAULT NULL::date, p_trial_price_after numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_row_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_subscription_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.subscription_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
     WHERE s.id = NEW.subscription_id AND s.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'subscription_owner_mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_subscription_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,038));
  IF (SELECT count(*) FROM public.subscriptions WHERE user_id=NEW.user_id AND deleted_at IS NULL) >= 1000 THEN
    RAISE EXCEPTION 'quota_exceeded: subscriptions (1000)' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.guard_deleted_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'subscription deleted' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.guard_deleted_subscription_reference()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.subscription_id IS NOT NULL THEN
    PERFORM id FROM public.subscriptions WHERE id=NEW.subscription_id AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE='P0002'; END IF;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_deferred_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone, p_deferred_until date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_hash text;
  v_existing public.idempotency_keys%ROWTYPE;
  v_body jsonb;
  v_path text := '/payment-events/deferred';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 OR p_deferred_until IS NULL THEN
    RAISE EXCEPTION 'invalid deferred payment input' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE id = p_subscription_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002';
  END IF;

  v_hash := encode(digest(concat_ws('|', p_subscription_id, p_amount::text, p_currency,
    p_paid_at::text, p_deferred_until::text), 'sha256'), 'hex');

  SELECT * INTO v_existing FROM public.idempotency_keys
    WHERE user_id = v_user AND method = 'POST' AND path = v_path
      AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;

  INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at, source, status, deferred_until)
    VALUES (v_user, p_subscription_id, p_amount, p_currency, p_paid_at, 'manual', 'DEFERRED', p_deferred_until)
    RETURNING to_jsonb(payment_events.*) INTO v_body;

  INSERT INTO public.idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', v_path, p_idempotency_key, v_hash, 201, v_body);
  RETURN v_body;
END; $function$;

CREATE OR REPLACE FUNCTION public.record_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user uuid := auth.uid(); v_hash text; v_existing idempotency_keys%ROWTYPE; v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE id = p_subscription_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002';
  END IF;
  v_hash := encode(digest(concat_ws('|', p_subscription_id, p_amount::text, p_currency, p_paid_at::text), 'sha256'), 'hex');
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id = v_user AND method = 'POST' AND path = '/payment-events' AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.response_body;
  END IF;
  INSERT INTO payment_events(user_id, subscription_id, amount, currency, paid_at, source)
    VALUES (v_user, p_subscription_id, p_amount, p_currency, p_paid_at, 'manual')
    RETURNING to_jsonb(payment_events.*) INTO v_body;
  INSERT INTO idempotency_keys(user_id, method, path, idempotency_key, request_hash, status, response_body)
    VALUES (v_user, 'POST', '/payment-events', p_idempotency_key, v_hash, 201, v_body);
  RETURN v_body;
END; $function$;

CREATE OR REPLACE FUNCTION public.replace_payment_methods(p_user_id uuid, p_names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.payment_methods WHERE user_id = p_user_id;

  INSERT INTO public.payment_methods (user_id, name)
  SELECT p_user_id, value
  FROM unnest(p_names) AS value;
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_export_idempotent(p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid:=auth.uid(); v_existing idempotency_keys%ROWTYPE; v_row exports%ROWTYPE; v_hash text:='export-v1';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id=v_user AND method='POST' AND path='/exports' AND idempotency_key=p_idempotency_key;
  IF FOUND THEN IF v_existing.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE='23505'; END IF; RETURN v_existing.response_body; END IF;
  INSERT INTO exports(user_id,status) VALUES(v_user,'PENDING') RETURNING * INTO v_row;
  INSERT INTO idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body) VALUES(v_user,'POST','/exports',p_idempotency_key,v_hash,202,to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END; $function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
END; $function$;

CREATE OR REPLACE FUNCTION public.sync_renewal_occurrence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_idempotent(p_idempotency_key text, p_subscription_id uuid, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric, p_notification_rules jsonb, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user uuid := auth.uid(); v_hash text; v_existing idempotency_keys%ROWTYPE; v_row subscriptions%ROWTYPE; v_body jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE='22023'; END IF;
  v_hash := encode(digest(concat_ws('|',p_subscription_id,p_name,p_amount::text,p_currency,p_billing_cycle,p_start_date::text,p_next_renewal_date::text,p_category,coalesce(p_notes,''),coalesce(p_payment_method,''),coalesce(p_trial_end_date::text,''),coalesce(p_trial_price_after::text,''),p_notification_rules::text,p_status),'sha256'),'hex');
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id=v_user AND method='PATCH' AND path='/subscriptions/'||p_subscription_id::text AND idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE='23505'; END IF;
    RETURN v_existing.response_body;
  END IF;
  UPDATE subscriptions SET name=trim(p_name),amount=p_amount,currency=p_currency,billing_cycle=p_billing_cycle,start_date=p_start_date,next_renewal_date=p_next_renewal_date,category=p_category,notes=p_notes,payment_method=p_payment_method,trial_end_date=p_trial_end_date,trial_price_after=p_trial_price_after,notification_rules=coalesce(p_notification_rules,'[]'::jsonb),status=p_status WHERE id=p_subscription_id AND user_id=v_user RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'subscription not found' USING ERRCODE='P0002'; END IF;
  v_body:=to_jsonb(v_row);
  INSERT INTO idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body) VALUES(v_user,'PATCH','/subscriptions/'||p_subscription_id::text,p_idempotency_key,v_hash,200,v_body);
  RETURN v_body;
END; $function$;


-- triggers
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sync_renewal_occurrence AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION sync_renewal_occurrence();
CREATE TRIGGER trg_quota_support_tickets BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION enforce_row_quota('100');
CREATE TRIGGER trg_quota_exports BEFORE INSERT ON public.exports FOR EACH ROW EXECUTE FUNCTION enforce_row_quota('200');
CREATE TRIGGER trg_quota_payment_events BEFORE INSERT ON public.payment_events FOR EACH ROW EXECUTE FUNCTION enforce_row_quota('50000');
CREATE TRIGGER trg_quota_savings_events BEFORE INSERT ON public.savings_events FOR EACH ROW EXECUTE FUNCTION enforce_row_quota('10000');
CREATE TRIGGER trg_owner_payment_events BEFORE INSERT OR UPDATE OF subscription_id, user_id ON public.payment_events FOR EACH ROW EXECUTE FUNCTION enforce_subscription_owner();
CREATE TRIGGER trg_owner_subscription_events BEFORE INSERT OR UPDATE OF subscription_id, user_id ON public.subscription_events FOR EACH ROW EXECUTE FUNCTION enforce_subscription_owner();
CREATE TRIGGER trg_owner_notifications BEFORE INSERT OR UPDATE OF subscription_id, user_id ON public.notifications FOR EACH ROW EXECUTE FUNCTION enforce_subscription_owner();
CREATE TRIGGER guard_deleted_subscription BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION guard_deleted_subscription();
CREATE TRIGGER guard_deleted_reference BEFORE INSERT ON public.payment_events FOR EACH ROW EXECUTE FUNCTION guard_deleted_subscription_reference();
CREATE TRIGGER guard_deleted_reference BEFORE INSERT ON public.subscription_events FOR EACH ROW EXECUTE FUNCTION guard_deleted_subscription_reference();
CREATE TRIGGER trg_quota_subscriptions BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION enforce_subscription_quota();

-- rls
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- policies
CREATE POLICY users_own_payment_methods ON public.payment_methods AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY users_own_payment_events ON public.payment_events AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_profiles ON public.profiles AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_renewal_occurrences ON public.renewal_occurrences AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_notifications ON public.notifications AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_notification_rules ON public.notification_rules AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_notification_deliveries ON public.notification_deliveries AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY support_tickets_own_insert ON public.support_tickets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY support_tickets_own_read ON public.support_tickets AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY service_catalog_public_read ON public.service_catalog AS PERMISSIVE FOR SELECT TO anon,authenticated USING ((is_active = true));
CREATE POLICY own_subscription_events ON public.subscription_events AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_savings_events ON public.savings_events AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_exports ON public.exports AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY own_idempotency_keys ON public.idempotency_keys AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY subscriptions_visible ON public.subscriptions AS RESTRICTIVE FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "user sees own subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- table_grants
GRANT SELECT ON public.payment_methods TO anon;
GRANT INSERT ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_methods TO authenticated;
GRANT UPDATE ON public.payment_methods TO authenticated;
GRANT DELETE ON public.payment_methods TO authenticated;
GRANT INSERT ON public.payment_methods TO service_role;
GRANT SELECT ON public.payment_methods TO service_role;
GRANT UPDATE ON public.payment_methods TO service_role;
GRANT DELETE ON public.payment_methods TO service_role;
GRANT TRUNCATE ON public.payment_methods TO service_role;
GRANT REFERENCES ON public.payment_methods TO service_role;
GRANT TRIGGER ON public.payment_methods TO service_role;
GRANT SELECT ON public.payment_events TO anon;
GRANT INSERT ON public.payment_events TO authenticated;
GRANT SELECT ON public.payment_events TO authenticated;
GRANT UPDATE ON public.payment_events TO authenticated;
GRANT DELETE ON public.payment_events TO authenticated;
GRANT INSERT ON public.payment_events TO service_role;
GRANT SELECT ON public.payment_events TO service_role;
GRANT UPDATE ON public.payment_events TO service_role;
GRANT DELETE ON public.payment_events TO service_role;
GRANT TRUNCATE ON public.payment_events TO service_role;
GRANT REFERENCES ON public.payment_events TO service_role;
GRANT TRIGGER ON public.payment_events TO service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT UPDATE ON public.profiles TO service_role;
GRANT DELETE ON public.profiles TO service_role;
GRANT TRUNCATE ON public.profiles TO service_role;
GRANT REFERENCES ON public.profiles TO service_role;
GRANT TRIGGER ON public.profiles TO service_role;
GRANT SELECT ON public.renewal_occurrences TO anon;
GRANT INSERT ON public.renewal_occurrences TO authenticated;
GRANT SELECT ON public.renewal_occurrences TO authenticated;
GRANT UPDATE ON public.renewal_occurrences TO authenticated;
GRANT DELETE ON public.renewal_occurrences TO authenticated;
GRANT INSERT ON public.renewal_occurrences TO service_role;
GRANT SELECT ON public.renewal_occurrences TO service_role;
GRANT UPDATE ON public.renewal_occurrences TO service_role;
GRANT DELETE ON public.renewal_occurrences TO service_role;
GRANT TRUNCATE ON public.renewal_occurrences TO service_role;
GRANT REFERENCES ON public.renewal_occurrences TO service_role;
GRANT TRIGGER ON public.renewal_occurrences TO service_role;
GRANT SELECT ON public.notifications TO anon;
GRANT INSERT ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO service_role;
GRANT UPDATE ON public.notifications TO service_role;
GRANT DELETE ON public.notifications TO service_role;
GRANT TRUNCATE ON public.notifications TO service_role;
GRANT REFERENCES ON public.notifications TO service_role;
GRANT TRIGGER ON public.notifications TO service_role;
GRANT SELECT ON public.notification_rules TO anon;
GRANT INSERT ON public.notification_rules TO authenticated;
GRANT SELECT ON public.notification_rules TO authenticated;
GRANT UPDATE ON public.notification_rules TO authenticated;
GRANT DELETE ON public.notification_rules TO authenticated;
GRANT INSERT ON public.notification_rules TO service_role;
GRANT SELECT ON public.notification_rules TO service_role;
GRANT UPDATE ON public.notification_rules TO service_role;
GRANT DELETE ON public.notification_rules TO service_role;
GRANT TRUNCATE ON public.notification_rules TO service_role;
GRANT REFERENCES ON public.notification_rules TO service_role;
GRANT TRIGGER ON public.notification_rules TO service_role;
GRANT SELECT ON public.notification_deliveries TO anon;
GRANT INSERT ON public.notification_deliveries TO authenticated;
GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT UPDATE ON public.notification_deliveries TO authenticated;
GRANT DELETE ON public.notification_deliveries TO authenticated;
GRANT INSERT ON public.notification_deliveries TO service_role;
GRANT SELECT ON public.notification_deliveries TO service_role;
GRANT UPDATE ON public.notification_deliveries TO service_role;
GRANT DELETE ON public.notification_deliveries TO service_role;
GRANT TRUNCATE ON public.notification_deliveries TO service_role;
GRANT REFERENCES ON public.notification_deliveries TO service_role;
GRANT TRIGGER ON public.notification_deliveries TO service_role;
GRANT INSERT ON public.support_tickets TO authenticated;
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;
GRANT DELETE ON public.support_tickets TO authenticated;
GRANT INSERT ON public.support_tickets TO service_role;
GRANT SELECT ON public.support_tickets TO service_role;
GRANT UPDATE ON public.support_tickets TO service_role;
GRANT DELETE ON public.support_tickets TO service_role;
GRANT TRUNCATE ON public.support_tickets TO service_role;
GRANT REFERENCES ON public.support_tickets TO service_role;
GRANT TRIGGER ON public.support_tickets TO service_role;
GRANT SELECT ON public.service_catalog TO anon;
GRANT INSERT ON public.service_catalog TO authenticated;
GRANT SELECT ON public.service_catalog TO authenticated;
GRANT UPDATE ON public.service_catalog TO authenticated;
GRANT DELETE ON public.service_catalog TO authenticated;
GRANT INSERT ON public.service_catalog TO service_role;
GRANT SELECT ON public.service_catalog TO service_role;
GRANT UPDATE ON public.service_catalog TO service_role;
GRANT DELETE ON public.service_catalog TO service_role;
GRANT TRUNCATE ON public.service_catalog TO service_role;
GRANT REFERENCES ON public.service_catalog TO service_role;
GRANT TRIGGER ON public.service_catalog TO service_role;
GRANT INSERT ON public.rate_limits TO service_role;
GRANT SELECT ON public.rate_limits TO service_role;
GRANT UPDATE ON public.rate_limits TO service_role;
GRANT DELETE ON public.rate_limits TO service_role;
GRANT TRUNCATE ON public.rate_limits TO service_role;
GRANT REFERENCES ON public.rate_limits TO service_role;
GRANT TRIGGER ON public.rate_limits TO service_role;
GRANT SELECT ON public.subscription_events TO anon;
GRANT INSERT ON public.subscription_events TO authenticated;
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT UPDATE ON public.subscription_events TO authenticated;
GRANT DELETE ON public.subscription_events TO authenticated;
GRANT INSERT ON public.subscription_events TO service_role;
GRANT SELECT ON public.subscription_events TO service_role;
GRANT UPDATE ON public.subscription_events TO service_role;
GRANT DELETE ON public.subscription_events TO service_role;
GRANT TRUNCATE ON public.subscription_events TO service_role;
GRANT REFERENCES ON public.subscription_events TO service_role;
GRANT TRIGGER ON public.subscription_events TO service_role;
GRANT SELECT ON public.savings_events TO anon;
GRANT INSERT ON public.savings_events TO authenticated;
GRANT SELECT ON public.savings_events TO authenticated;
GRANT UPDATE ON public.savings_events TO authenticated;
GRANT DELETE ON public.savings_events TO authenticated;
GRANT INSERT ON public.savings_events TO service_role;
GRANT SELECT ON public.savings_events TO service_role;
GRANT UPDATE ON public.savings_events TO service_role;
GRANT DELETE ON public.savings_events TO service_role;
GRANT TRUNCATE ON public.savings_events TO service_role;
GRANT REFERENCES ON public.savings_events TO service_role;
GRANT TRIGGER ON public.savings_events TO service_role;
GRANT SELECT ON public.exports TO anon;
GRANT INSERT ON public.exports TO authenticated;
GRANT SELECT ON public.exports TO authenticated;
GRANT UPDATE ON public.exports TO authenticated;
GRANT DELETE ON public.exports TO authenticated;
GRANT INSERT ON public.exports TO service_role;
GRANT SELECT ON public.exports TO service_role;
GRANT UPDATE ON public.exports TO service_role;
GRANT DELETE ON public.exports TO service_role;
GRANT TRUNCATE ON public.exports TO service_role;
GRANT REFERENCES ON public.exports TO service_role;
GRANT TRIGGER ON public.exports TO service_role;
GRANT SELECT ON public.idempotency_keys TO anon;
GRANT INSERT ON public.idempotency_keys TO authenticated;
GRANT SELECT ON public.idempotency_keys TO authenticated;
GRANT UPDATE ON public.idempotency_keys TO authenticated;
GRANT DELETE ON public.idempotency_keys TO authenticated;
GRANT INSERT ON public.idempotency_keys TO service_role;
GRANT SELECT ON public.idempotency_keys TO service_role;
GRANT UPDATE ON public.idempotency_keys TO service_role;
GRANT DELETE ON public.idempotency_keys TO service_role;
GRANT TRUNCATE ON public.idempotency_keys TO service_role;
GRANT REFERENCES ON public.idempotency_keys TO service_role;
GRANT TRIGGER ON public.idempotency_keys TO service_role;
GRANT SELECT ON public.subscriptions TO anon;
GRANT INSERT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT UPDATE ON public.subscriptions TO authenticated;
GRANT DELETE ON public.subscriptions TO authenticated;
GRANT INSERT ON public.subscriptions TO service_role;
GRANT SELECT ON public.subscriptions TO service_role;
GRANT UPDATE ON public.subscriptions TO service_role;
GRANT DELETE ON public.subscriptions TO service_role;
GRANT TRUNCATE ON public.subscriptions TO service_role;
GRANT REFERENCES ON public.subscriptions TO service_role;
GRANT TRIGGER ON public.subscriptions TO service_role;

-- function_grants
REVOKE ALL ON FUNCTION public.confirm_subscription_renewal_in_timezone_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date, p_timezone text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.confirm_subscription_renewal_in_timezone_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date, p_timezone text) TO authenticated; GRANT EXECUTE ON FUNCTION public.confirm_subscription_renewal_in_timezone_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date, p_timezone text) TO service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon; GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated; GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
REVOKE ALL ON FUNCTION public.replace_payment_methods(p_user_id uuid, p_names text[]) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.replace_payment_methods(p_user_id uuid, p_names text[]) TO service_role;
REVOKE ALL ON FUNCTION public.sync_renewal_occurrence() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.sync_renewal_occurrence() TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO service_role;
REVOKE ALL ON FUNCTION public.update_subscription_idempotent(p_idempotency_key text, p_subscription_id uuid, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric, p_notification_rules jsonb, p_status text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.update_subscription_idempotent(p_idempotency_key text, p_subscription_id uuid, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric, p_notification_rules jsonb, p_status text) TO authenticated; GRANT EXECUTE ON FUNCTION public.update_subscription_idempotent(p_idempotency_key text, p_subscription_id uuid, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric, p_notification_rules jsonb, p_status text) TO service_role;
REVOKE ALL ON FUNCTION public.create_subscription_idempotent(p_idempotency_key text, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.create_subscription_idempotent(p_idempotency_key text, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric) TO authenticated; GRANT EXECUTE ON FUNCTION public.create_subscription_idempotent(p_idempotency_key text, p_name text, p_amount numeric, p_currency text, p_billing_cycle text, p_start_date date, p_next_renewal_date date, p_category text, p_notes text, p_payment_method text, p_trial_end_date date, p_trial_price_after numeric) TO service_role;
REVOKE ALL ON FUNCTION public.record_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.record_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone) TO authenticated; GRANT EXECUTE ON FUNCTION public.record_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public.request_export_idempotent(p_idempotency_key text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.request_export_idempotent(p_idempotency_key text) TO authenticated; GRANT EXECUTE ON FUNCTION public.request_export_idempotent(p_idempotency_key text) TO service_role;
REVOKE ALL ON FUNCTION public.enforce_subscription_owner() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.enforce_subscription_owner() TO service_role;
REVOKE ALL ON FUNCTION public.enforce_row_quota() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.enforce_row_quota() TO service_role;
REVOKE ALL ON FUNCTION public.check_rate_limit(p_user_id uuid, p_bucket text, p_limit integer, p_window_seconds integer) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.check_rate_limit(p_user_id uuid, p_bucket text, p_limit integer, p_window_seconds integer) TO service_role;
REVOKE ALL ON FUNCTION public.soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[]) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[]) TO authenticated; GRANT EXECUTE ON FUNCTION public.soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.guard_deleted_subscription_reference() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.guard_deleted_subscription_reference() TO service_role;
REVOKE ALL ON FUNCTION public.enforce_subscription_quota() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.enforce_subscription_quota() TO service_role;
REVOKE ALL ON FUNCTION public.confirm_subscription_renewal_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.confirm_subscription_renewal_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date) TO authenticated; GRANT EXECUTE ON FUNCTION public.confirm_subscription_renewal_idempotent(p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date) TO service_role;
REVOKE ALL ON FUNCTION public.record_deferred_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone, p_deferred_until date) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.record_deferred_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone, p_deferred_until date) TO authenticated; GRANT EXECUTE ON FUNCTION public.record_deferred_payment_idempotent(p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamp with time zone, p_deferred_until date) TO service_role;
REVOKE ALL ON FUNCTION public.guard_deleted_subscription() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.guard_deleted_subscription() TO service_role;
