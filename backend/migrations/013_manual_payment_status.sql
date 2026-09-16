-- Manual payment tracking: users mark payments themselves; no payment provider.
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PAID'
    CHECK (status IN ('PAID', 'UNPAID', 'DEFERRED', 'SKIPPED')),
  ADD COLUMN IF NOT EXISTS deferred_until DATE;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_subscription_paid_at_idx
  ON public.payment_events (subscription_id, paid_at)
  WHERE status = 'PAID';
