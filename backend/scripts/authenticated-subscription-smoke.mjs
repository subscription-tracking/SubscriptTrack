/**
 * Authenticated S31 smoke check.
 *
 * This script creates one clearly labelled test subscription and removes it in
 * a finally block. It never prints credentials, tokens, or response bodies.
 * It refuses to mutate a remote project unless S31_SMOKE_CONFIRM=run is set.
 */
import { randomUUID } from 'node:crypto';

const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
const deleteAccountAfterSmoke = process.env.S31_DELETE_ACCOUNT_AFTER_SMOKE === 'run';

for (const [name, value] of Object.entries({
  SUPABASE_URL: base,
  SUPABASE_ANON_KEY: anonKey,
  S31_TEST_EMAIL: email,
  S31_TEST_PASSWORD: password,
})) {
  if (!value) throw new Error(`${name} is required.`);
}

if (process.env.S31_SMOKE_CONFIRM !== 'run') {
  throw new Error('Refusing remote mutation. Set S31_SMOKE_CONFIRM=run to execute.');
}

async function request(path, { method = 'GET', token, body, expected = [200] } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token ?? anonKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!expected.includes(response.status)) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`${method} ${path} returned HTTP ${response.status}: ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

const date = (value) => value.toISOString().slice(0, 10);
const now = new Date();
const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 31));
const renewalDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 28));
const testName = `S31 smoke ${randomUUID()}`;
const createKey = `s31-create-${randomUUID()}`;
const updateKey = `s31-update-${randomUUID()}`;
let token;
let subscriptionId;

try {
  const session = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  token = session.access_token;
  if (!token) throw new Error('Authenticated session did not return an access token.');
  console.log('PASS authenticated-session');

  const createPayload = {
    p_idempotency_key: createKey,
    p_name: testName,
    p_amount: '31.00',
    p_currency: 'TRY',
    p_billing_cycle: 'monthly',
    p_start_date: date(startDate),
    p_next_renewal_date: date(renewalDate),
    p_category: 'other',
    p_notes: 'S31 temporary smoke record',
    p_payment_method: null,
    p_trial_end_date: null,
    p_trial_price_after: null,
  };
  const created = await request('/rest/v1/rpc/create_subscription_idempotent', {
    method: 'POST', token, body: createPayload,
  });
  subscriptionId = created.id;
  if (!subscriptionId) throw new Error('Create RPC did not return a subscription id.');
  console.log('PASS create');

  const [saved] = await request(
    `/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id,name,start_date`,
    { token },
  );
  if (saved?.id !== subscriptionId || saved?.name !== testName || saved?.start_date !== date(startDate)) {
    throw new Error('Readback did not match the created subscription.');
  }
  console.log('PASS readback');

  const repeatedCreate = await request('/rest/v1/rpc/create_subscription_idempotent', {
    method: 'POST', token, body: createPayload,
  });
  if (repeatedCreate.id !== subscriptionId) {
    throw new Error('Create idempotency returned a different subscription id.');
  }
  console.log('PASS create-idempotency');

  const updatePayload = {
    p_idempotency_key: updateKey,
    p_subscription_id: subscriptionId,
    p_name: testName,
    p_amount: '31.00',
    p_currency: 'TRY',
    p_billing_cycle: 'monthly',
    p_start_date: date(startDate),
    p_next_renewal_date: date(renewalDate),
    p_category: 'other',
    p_notes: 'S31 updated temporary smoke record',
    p_payment_method: null,
    p_trial_end_date: null,
    p_trial_price_after: null,
    p_notification_rules: [{ daysBefore: 3, enabled: true }],
    p_status: 'active',
  };
  const updated = await request('/rest/v1/rpc/update_subscription_idempotent', {
    method: 'POST', token, body: updatePayload,
  });
  if (updated.id !== subscriptionId || updated.start_date !== date(startDate)) {
    throw new Error('Update RPC did not preserve the subscription id and start_date.');
  }
  console.log('PASS update-start-date');

  const repeatedUpdate = await request('/rest/v1/rpc/update_subscription_idempotent', {
    method: 'POST', token, body: updatePayload,
  });
  if (repeatedUpdate.id !== subscriptionId) {
    throw new Error('Update idempotency returned a different subscription id.');
  }
  console.log('PASS update-idempotency');

  await request('/rest/v1/rpc/update_subscription_idempotent', {
    method: 'POST',
    token,
    body: { ...updatePayload, p_amount: '32.00' },
    expected: [400, 409],
  });
  console.log('PASS idempotency-conflict');
} finally {
  if (token && subscriptionId) {
    await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`, {
      method: 'DELETE', token, expected: [204],
    });
    console.log('PASS cleanup');
  }
}

if (deleteAccountAfterSmoke) {
  await request('/functions/v1/delete-account', {
    method: 'POST', token, body: {}, expected: [200],
  });
  console.log('PASS account-cleanup');
}
