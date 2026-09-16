-- S28: Gerçek ödeme/yenileme geçmişi.
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL,
  paid_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'renewal', 'import')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_user_date
  ON public.payment_events (user_id, paid_at DESC);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_events' AND policyname = 'users_own_payment_events') THEN
    CREATE POLICY users_own_payment_events ON public.payment_events
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
