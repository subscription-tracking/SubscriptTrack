-- S26: Explicitly enable RLS on every user-owned table.
-- Policies are idempotent and keep the client scoped to auth.uid().

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'profiles', 'subscriptions', 'billing_schedules',
    'renewal_occurrences', 'subscription_events', 'savings_events',
    'notifications', 'notification_rules', 'notification_deliveries',
    'device_tokens', 'exports', 'idempotency_keys'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- The existing per-table policies in 005/007 remain authoritative.
-- This migration intentionally adds no broad service-role or anonymous policy.
