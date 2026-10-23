\set ON_ERROR_STOP on
-- Scenario 13: a subscription price change must not rewrite past payment rows.
CREATE TABLE public.subscriptions (id uuid PRIMARY KEY, user_id uuid NOT NULL, amount numeric(12,2) NOT NULL, currency char(3) NOT NULL);
CREATE TABLE public.payment_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  subscription_id uuid NOT NULL, amount numeric(12,2) NOT NULL, currency char(3) NOT NULL, paid_at timestamptz NOT NULL);
INSERT INTO public.subscriptions VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 49.90, 'TRY');
INSERT INTO public.payment_events(user_id, subscription_id, amount, currency, paid_at)
  VALUES ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 49.90, 'TRY', '2026-09-01T09:00:00Z');

UPDATE public.subscriptions SET amount = 59.90 WHERE id = '20000000-0000-0000-0000-000000000001';

DO $$
BEGIN
  IF (SELECT amount FROM public.payment_events WHERE subscription_id = '20000000-0000-0000-0000-000000000001') <> 49.90 THEN
    RAISE EXCEPTION 'past payment amount changed after price update';
  END IF;
  IF (SELECT amount FROM public.subscriptions WHERE id = '20000000-0000-0000-0000-000000000001') <> 59.90 THEN
    RAISE EXCEPTION 'subscription price was not updated';
  END IF;
END $$;
SELECT 'price-change assertions passed' AS result;
