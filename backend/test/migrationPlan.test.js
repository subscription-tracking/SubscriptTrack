import test from 'node:test';
import assert from 'node:assert/strict';
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
