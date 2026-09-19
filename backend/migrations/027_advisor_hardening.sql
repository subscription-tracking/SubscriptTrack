-- 027: Fixes from Supabase's own security/performance advisor run against
-- the live database (not caught by the static 001-026 read-through).
--
-- Findings, in order:
--  1) update_subscription_idempotent existed as TWO overloads: the original
--     018 signature (no p_start_date) and the 022 signature (with
--     p_start_date). CREATE OR REPLACE only replaces a function with an
--     identical parameter list, so adding p_start_date in 022 created a
--     second function instead of replacing the first — the old one was
--     still live and callable. Drops the orphaned old-signature overload.
--  2) Every SECURITY DEFINER RPC meant for direct mobile-client use
--     (create/update_subscription_idempotent, record_payment_idempotent,
--     request_export_idempotent) was still executable by the `anon` role.
--     REVOKE ALL ... FROM PUBLIC (017-025) does not revoke a grant Supabase
--     applies by default to `anon`/`authenticated` specifically when a
--     function is created in the exposed public schema. Each function's own
--     auth.uid() IS NULL check still blocks unauthenticated calls, but
--     leaving anon with EXECUTE is unnecessary attack surface. Revokes it.
--  3) handle_new_user_profile (auth.users insert trigger) and
--     sync_renewal_occurrence (renewal_occurrences sync trigger) are meant
--     to run only via their triggers, never called directly, but Supabase
--     auto-exposes every public-schema function as a PostgREST RPC
--     endpoint. Revokes EXECUTE from anon and authenticated so neither can
--     invoke them directly through /rest/v1/rpc/...; the triggers keep
--     firing normally (trigger execution doesn't need a role grant).
--  4) set_updated_at (generic updated_at trigger) had a mutable
--     search_path. Not SECURITY DEFINER and its body has no dynamic
--     identifier resolution, so this was low-risk, but pins it anyway for
--     defense in depth and to clear the advisor warning.

-- ── 1) drop the orphaned pre-022 update_subscription_idempotent overload ──

DROP FUNCTION IF EXISTS public.update_subscription_idempotent(
  text, uuid, text, numeric, text, text, date, text, text, text, date, numeric, jsonb, text
);

-- ── 2) direct-client RPCs: authenticated only, never anon ─────────────────

REVOKE EXECUTE ON FUNCTION public.create_subscription_idempotent(
  text, text, numeric, text, text, date, date, text, text, text, date, numeric
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.update_subscription_idempotent(
  text, uuid, text, numeric, text, text, date, date, text, text, text, date, numeric, jsonb, text
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.record_payment_idempotent(
  text, uuid, numeric, text, timestamptz
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.request_export_idempotent(text) FROM anon;

-- ── 3) trigger-only functions: no direct caller, authenticated or anon ────
--
-- REVOKE ... FROM anon, authenticated alone is not enough: 006/016/021/023
-- never revoked the implicit PUBLIC grant every function gets at creation
-- (visible as a bare "=X/<owner>" entry in pg_proc.proacl), and a PUBLIC
-- grant applies to every role regardless of any explicit per-role revoke.
-- Revoking from PUBLIC first, then granting back only to the roles that
-- legitimately need it (the function owner and service_role, for any
-- administrative/backfill use — trigger firing itself needs no grant at
-- all), is what actually removes anon/authenticated's access.

REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_renewal_occurrence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.sync_renewal_occurrence() TO postgres, service_role;

-- ── 4) pin search_path on the remaining unpinned trigger function ─────────

ALTER FUNCTION public.set_updated_at() SET search_path = public;
