import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checksum, isCanonicalMigration, migrationId } from '../src/db/migrationPlan.js';

test('canonical migration selection excludes retired direct-client schema', () => {
  assert.equal(isCanonicalMigration('001_initial_schema.sql'), true);
  assert.equal(isCanonicalMigration('003_subscription_api_contract.sql'), true);
  assert.equal(isCanonicalMigration('002_mobile_ready.sql'), false);
  assert.equal(isCanonicalMigration('notes.md'), false);
});

test('migration id removes only the SQL suffix', () => {
  assert.equal(migrationId('003_subscription_api_contract.sql'), '003_subscription_api_contract');
});

test('checksum is deterministic and changes when SQL changes', () => {
  assert.equal(checksum('SELECT 1;'), checksum('SELECT 1;'));
  assert.notEqual(checksum('SELECT 1;'), checksum('SELECT 2;'));
});

test('022 update RPC preserves start_date in its public contract', async () => {
  const migration = await readFile(
    new URL('../migrations/022_subscription_start_date_update.sql', import.meta.url),
    'utf8',
  );

  assert.match(
    migration,
    /p_billing_cycle text, p_start_date date,\s*p_next_renewal_date date/,
  );
  assert.match(migration, /start_date=p_start_date/);
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.update_subscription_idempotent\(text,uuid,text,numeric,text,text,date,date,text,text,text,date,numeric,jsonb,text\) TO authenticated/,
  );
});

test('023 Auth profile trigger matches the public profiles schema', async () => {
  const migration = await readFile(
    new URL('../migrations/023_auth_profile_trigger_schema_alignment.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /INSERT INTO public\.profiles \(user_id\)/);
  assert.match(migration, /ON CONFLICT \(user_id\) DO NOTHING/);
  assert.doesNotMatch(migration, /display_name/);
});

test('024 restores the authenticated create-subscription RPC', async () => {
  const migration = await readFile(
    new URL('../migrations/024_live_create_subscription_rpc.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_subscription_idempotent/);
  assert.match(migration, /p_start_date date/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_subscription_idempotent/);
});

test('025 allows idempotency RPCs to resolve pgcrypto safely', async () => {
  const migration = await readFile(
    new URL('../migrations/025_idempotency_function_extension_path.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /create_subscription_idempotent[\s\S]*SET search_path TO public, extensions/);
  assert.match(migration, /update_subscription_idempotent[\s\S]*SET search_path TO public, extensions/);
});

test('026 record_payment_idempotent verifies subscription ownership before insert', async () => {
  const migration = await readFile(
    new URL('../migrations/026_security_hardening_followup.sql', import.meta.url),
    'utf8',
  );

  const fn = migration.slice(
    migration.indexOf('CREATE OR REPLACE FUNCTION public.record_payment_idempotent'),
    migration.indexOf('REVOKE ALL ON FUNCTION public.record_payment_idempotent'),
  );

  // The ownership check must run before any row is written, so it has to
  // precede both the payment_events insert and the idempotency_keys insert.
  const ownershipCheckIdx = fn.search(
    /NOT EXISTS \(\s*SELECT 1 FROM subscriptions WHERE id = p_subscription_id AND user_id = v_user\s*\)/,
  );
  const paymentInsertIdx = fn.indexOf('INSERT INTO payment_events');

  assert.notEqual(ownershipCheckIdx, -1,
    'record_payment_idempotent must verify p_subscription_id belongs to auth.uid()');
  assert.ok(ownershipCheckIdx < paymentInsertIdx,
    'ownership check must run before the payment_events insert');
  assert.match(fn, /RAISE EXCEPTION 'subscription not found' USING ERRCODE = 'P0002'/);
});

test('026 reconciles idempotency_keys columns additively (no destructive drops)', async () => {
  const migration = await readFile(
    new URL('../migrations/026_security_hardening_followup.sql', import.meta.url),
    'utf8',
  );

  for (const column of ['user_id', 'method', 'path', 'idempotency_key', 'request_hash', 'status', 'response_body']) {
    assert.match(
      migration,
      new RegExp(`ADD COLUMN IF NOT EXISTS ${column}\\b`),
      `expected an additive ADD COLUMN IF NOT EXISTS for ${column}`,
    );
  }
  assert.doesNotMatch(migration, /DROP COLUMN/);
  assert.match(migration, /DELETE FROM public\.idempotency_keys WHERE user_id IS NULL/);
  assert.match(migration, /CREATE POLICY own_idempotency_keys ON public\.idempotency_keys/);
});

test('026 grants billing_schedules access only through the owning subscription', async () => {
  const migration = await readFile(
    new URL('../migrations/026_security_hardening_followup.sql', import.meta.url),
    'utf8',
  );

  for (const action of ['select', 'insert', 'update', 'delete']) {
    assert.match(
      migration,
      new RegExp(`"billing_schedules: ${action} own"[\\s\\S]{0,400}s\\.user_id = auth\\.uid\\(\\)`),
    );
  }
});

test('026 locks down write access to categories/services reference tables', async () => {
  const migration = await readFile(
    new URL('../migrations/026_security_hardening_followup.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON public\.categories FROM authenticated, anon/);
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON public\.services FROM authenticated, anon/);
  assert.match(migration, /GRANT SELECT ON public\.categories TO authenticated, anon/);
  assert.match(migration, /GRANT SELECT ON public\.services TO authenticated, anon/);
});

test('027 drops the orphaned pre-022 update_subscription_idempotent overload', async () => {
  const migration = await readFile(
    new URL('../migrations/027_advisor_hardening.sql', import.meta.url),
    'utf8',
  );

  // The orphaned overload is the 018 signature (14 args, no p_start_date);
  // the DROP statement itself must not carry the current 022+ signature's
  // second `date` (p_start_date immediately followed by p_next_renewal_date).
  const dropStatement = migration.slice(
    migration.indexOf('DROP FUNCTION IF EXISTS public.update_subscription_idempotent'),
    migration.indexOf(');', migration.indexOf('DROP FUNCTION IF EXISTS public.update_subscription_idempotent')) + 2,
  );

  assert.match(
    dropStatement,
    /text, uuid, text, numeric, text, text, date, text, text, text, date, numeric, jsonb, text/,
  );
  assert.doesNotMatch(dropStatement, /date, date,/);
});

test('027 revokes anon execute on direct-client mutation RPCs', async () => {
  const migration = await readFile(
    new URL('../migrations/027_advisor_hardening.sql', import.meta.url),
    'utf8',
  );

  for (const fn of [
    'create_subscription_idempotent',
    'update_subscription_idempotent',
    'record_payment_idempotent',
    'request_export_idempotent',
  ]) {
    assert.match(
      migration,
      new RegExp(`REVOKE EXECUTE ON FUNCTION public\\.${fn}\\([\\s\\S]{0,400}\\) FROM anon;`),
      `expected an anon revoke for ${fn}`,
    );
  }
});

test('027 fully revokes PUBLIC (not just anon/authenticated) on trigger-only functions', async () => {
  const migration = await readFile(
    new URL('../migrations/027_advisor_hardening.sql', import.meta.url),
    'utf8',
  );

  for (const fn of ['handle_new_user_profile', 'sync_renewal_occurrence']) {
    assert.match(
      migration,
      new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(\\) FROM PUBLIC;`),
      `expected a PUBLIC revoke for ${fn} (revoking only anon/authenticated leaves the implicit PUBLIC grant in effect)`,
    );
  }
});

test('027 pins search_path on set_updated_at', async () => {
  const migration = await readFile(
    new URL('../migrations/027_advisor_hardening.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /ALTER FUNCTION public\.set_updated_at\(\) SET search_path = public;/);
});
