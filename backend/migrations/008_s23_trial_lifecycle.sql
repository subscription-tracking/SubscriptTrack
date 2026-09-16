-- S23: trial and expired subscription lifecycle fields.
-- Safe to run more than once in a development/staging database.

alter table public.subscriptions
  add column if not exists trial_end_date date,
  add column if not exists trial_price_after numeric(19, 4);

alter table public.subscriptions
  drop constraint if exists subscriptions_trial_price_after_positive;

alter table public.subscriptions
  add constraint subscriptions_trial_price_after_positive
  check (trial_price_after is null or trial_price_after > 0);

create index if not exists subscriptions_trial_end_date_idx
  on public.subscriptions (user_id, trial_end_date)
  where trial_end_date is not null;

comment on column public.subscriptions.trial_end_date is
  'Calendar date on which a trial converts or expires.';
comment on column public.subscriptions.trial_price_after is
  'Recurring price applied after the trial, in the subscription currency.';
