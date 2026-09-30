-- 031: Supabase performance advisor "Auth RLS Initialization Plan".
--
-- RLS policies that call auth.uid() directly are re-evaluated for every row.
-- Wrapping the call as (select auth.uid()) lets Postgres evaluate it once per
-- statement (InitPlan). Semantics are identical.
--
-- Policy names in the live database do not match 001-030 one-to-one (several
-- migrations create policies conditionally), so this rewrites whatever
-- policies exist in the public schema instead of naming them. It is
-- idempotent: policies already using (select auth.uid()) are skipped, and a
-- second run changes nothing. Roles and command type of each policy are kept
-- (ALTER POLICY only replaces the USING / WITH CHECK expressions).

DO $$
DECLARE
  p record;
  v_using text;
  v_check text;
  v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ~ 'auth\.uid\(\)' OR with_check ~ 'auth\.uid\(\)')
  LOOP
    v_using := p.qual;
    v_check := p.with_check;

    IF v_using IS NOT NULL AND v_using !~* 'select\s+auth\.uid\(\)' THEN
      v_using := regexp_replace(v_using, 'auth\.uid\(\)', '(select auth.uid())', 'g');
    END IF;
    IF v_check IS NOT NULL AND v_check !~* 'select\s+auth\.uid\(\)' THEN
      v_check := regexp_replace(v_check, 'auth\.uid\(\)', '(select auth.uid())', 'g');
    END IF;

    CONTINUE WHEN v_using IS NOT DISTINCT FROM p.qual
              AND v_check IS NOT DISTINCT FROM p.with_check;

    v_sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF v_using IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_using);
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;
    EXECUTE v_sql;
  END LOOP;
END $$;
