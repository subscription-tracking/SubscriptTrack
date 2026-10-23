/**
 * Cross-account RLS smoke check for two disposable test users.
 * Requires RLS_TEST_A_EMAIL/PASSWORD and RLS_TEST_B_EMAIL/PASSWORD plus the
 * Supabase URL/anon key. Creates one clearly labelled row under A, verifies B
 * cannot read, update, or delete it, and cleans it up as A in a finally block.
 * No credentials, tokens, or response bodies are printed. Remote writes require
 * S31_SMOKE_CONFIRM=run.
 */
import { randomUUID } from 'node:crypto';

const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const accounts = [
  { label: 'A', email: process.env.RLS_TEST_A_EMAIL, password: process.env.RLS_TEST_A_PASSWORD },
  { label: 'B', email: process.env.RLS_TEST_B_EMAIL, password: process.env.RLS_TEST_B_PASSWORD },
];

for (const [name, value] of Object.entries({
  SUPABASE_URL: base,
  SUPABASE_ANON_KEY: key,
  RLS_TEST_A_EMAIL: accounts[0].email,
  RLS_TEST_A_PASSWORD: accounts[0].password,
  RLS_TEST_B_EMAIL: accounts[1].email,
  RLS_TEST_B_PASSWORD: accounts[1].password,
})) {
  if (!value) throw new Error(`${name} is required.`);
}
if (accounts[0].email.toLowerCase() === accounts[1].email.toLowerCase()) {
  throw new Error('RLS test requires two different accounts.');
}
if (process.env.S31_SMOKE_CONFIRM !== 'run') {
  throw new Error('Refusing remote mutation. Set S31_SMOKE_CONFIRM=run to execute.');
}

async function request(path, { method = 'GET', token, body, expected = [200], represent = false } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(represent ? { Prefer: 'return=representation' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path.split('?')[0]} returned HTTP ${response.status}.`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signIn(account) {
  const session = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: account.email, password: account.password },
  });
  if (typeof session?.access_token !== 'string' || typeof session?.user?.id !== 'string') {
    throw new Error(`Test account ${account.label} did not return a valid session.`);
  }
  return { token: session.access_token, userId: session.user.id };
}

const today = new Date().toISOString().slice(0, 10);
const marker = `RLS smoke ${randomUUID()}`;
const idempotencyKey = `rls-smoke-${randomUUID()}`;
let tokenA;
let subscriptionId;

try {
  const [a, b] = await Promise.all(accounts.map(signIn));
  tokenA = a.token;
  if (a.userId === b.userId) throw new Error('Supabase returned the same user for both test accounts.');
  console.log('PASS two-distinct-authenticated-accounts');

  const created = await request('/rest/v1/rpc/create_subscription_idempotent', {
    method: 'POST',
    token: a.token,
    body: {
      p_idempotency_key: idempotencyKey,
      p_name: marker,
      p_amount: '1.00',
      p_currency: 'TRY',
      p_billing_cycle: 'monthly',
      p_start_date: today,
      p_next_renewal_date: today,
      p_category: 'other',
      p_notes: 'Temporary cross-account RLS check',
      p_payment_method: null,
      p_trial_end_date: null,
      p_trial_price_after: null,
    },
  });
  subscriptionId = created?.id;
  if (typeof subscriptionId !== 'string') throw new Error('Account A create RPC did not return a subscription id.');
  console.log('PASS account-a-created-temporary-row');

  const path = `/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id,name`;
  const hidden = await request(path, { token: b.token });
  if (!Array.isArray(hidden) || hidden.length !== 0) throw new Error('Account B could read account A subscription.');
  console.log('PASS account-b-cannot-read');

  const update = await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id`, {
    method: 'PATCH', token: b.token, body: { name: `${marker} altered` }, represent: true,
  });
  if (!Array.isArray(update) || update.length !== 0) throw new Error('Account B updated account A subscription.');
  console.log('PASS account-b-cannot-update');

  const deletion = await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id`, {
    method: 'DELETE', token: b.token, represent: true,
  });
  if (!Array.isArray(deletion) || deletion.length !== 0) throw new Error('Account B deleted account A subscription.');
  console.log('PASS account-b-cannot-delete');

  const unchanged = await request(path, { token: a.token });
  if (!Array.isArray(unchanged) || unchanged.length !== 1 || unchanged[0].name !== marker) {
    throw new Error('Account A row was changed during account B isolation checks.');
  }
  console.log('PASS account-a-row-unchanged');
} finally {
  if (tokenA && subscriptionId) {
    await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`, {
      method: 'DELETE', token: tokenA, expected: [204],
    });
    const remaining = await request(
      `/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id`, { token: tokenA },
    );
    if (!Array.isArray(remaining) || remaining.length !== 0) {
      throw new Error('Temporary RLS subscription remained after cleanup.');
    }
    console.log('PASS account-a-cleanup');
  }
}
