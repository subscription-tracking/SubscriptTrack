import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('038 provides soft deletion without deleting financial history or replacing old RPCs', async () => {
  const sql = await source('../migrations/038_subscription_soft_delete.sql');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS deleted_at/);
  assert.match(sql, /AS RESTRICTIVE\s+FOR SELECT/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /ORDER BY id FOR UPDATE/);
  assert.match(sql, /response_body/);
  assert.match(sql, /deleted_at IS NULL\) >= 1000/);
  assert.doesNotMatch(sql, /DELETE FROM public\.(payment_events|savings_events)/);
  assert.doesNotMatch(sql, /DROP FUNCTION.*(create_subscription|update_subscription|record_payment)/);
});
test('service-role normal export excludes removed subscriptions', async () => {
  const code = await source('../supabase/functions/process-export/index.ts');
  assert.match(code, /\.from\('subscriptions'\).*\.is\('deleted_at', null\)/);
});
test('039 preserves fixed existing profiles and defaults new profiles to device', async () => {
  const sql = await source('../migrations/039_profile_timezone_mode.sql');
  assert.match(sql, /timezone_mode text NOT NULL DEFAULT 'fixed'/);
  assert.match(sql, /timezone_mode SET DEFAULT 'device'/);
  assert.match(sql, /CASE WHEN timezone_mode = 'device' THEN p_timezone ELSE timezone END/);
  assert.match(sql, /pg_timezone_names/);
  assert.match(sql, /v_row\.deleted_at IS NOT NULL/);
});
