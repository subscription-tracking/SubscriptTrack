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
