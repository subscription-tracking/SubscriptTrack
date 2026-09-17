-- Sprint 3: per-subscription reminder rules. Existing rows keep the default
-- application rule when this nullable column is absent.
alter table public.subscriptions
  add column if not exists notification_rules jsonb not null default '[{"daysBefore":3,"enabled":true}]'::jsonb;

alter table public.subscriptions
  drop constraint if exists subscriptions_notification_rules_array;

alter table public.subscriptions
  add constraint subscriptions_notification_rules_array
  check (jsonb_typeof(notification_rules) = 'array');
