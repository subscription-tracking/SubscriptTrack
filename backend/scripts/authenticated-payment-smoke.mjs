/** Temporary payment contract check; deletes its payment and subscription in finally. */
import { randomUUID } from 'node:crypto';

const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account configuration is required.');
if (process.env.S31_SMOKE_CONFIRM !== 'run') throw new Error('Refusing remote mutation without S31_SMOKE_CONFIRM=run.');

async function request(path, { token, method = 'GET', body, expected = [200], represent = false } = {}) {
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
  if (!expected.includes(response.status)) throw new Error(`${method} ${path.split('?')[0]} returned HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
const token = session.access_token;
if (!token) throw new Error('Test account login failed.');
const marker = randomUUID();
let subscriptionId;
let paymentId;
try {
  const subscription = await request('/rest/v1/rpc/create_subscription_idempotent', {
    token, method: 'POST', body: {
      p_idempotency_key: `payment-smoke-sub-${marker}`,
      p_name: `Payment smoke ${marker}`,
      p_amount: '13.00',
      p_currency: 'TRY',
      p_billing_cycle: 'monthly',
      p_start_date: '2026-10-01',
      p_next_renewal_date: '2026-11-01',
      p_category: 'other',
      p_notes: 'Temporary payment smoke record',
      p_payment_method: null,
      p_trial_end_date: null,
      p_trial_price_after: null,
    },
  });
  subscriptionId = subscription.id;
  if (!subscriptionId) throw new Error('Temporary subscription was not created.');
  const payload = {
    p_idempotency_key: `payment-smoke-event-${marker}`,
    p_subscription_id: subscriptionId,
    p_amount: '13.00',
    p_currency: 'TRY',
    p_paid_at: '2026-10-10T12:00:00.000Z',
  };
  const payment = await request('/rest/v1/rpc/record_payment_idempotent', { token, method: 'POST', body: payload });
  paymentId = payment.id;
  if (!paymentId) throw new Error('Payment RPC did not return an id.');
  const path = `/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}`;
  const rows = await request(`${path}&select=id,subscription_id,amount,currency,paid_at,status`, { token });
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].subscription_id !== subscriptionId || Number(rows[0].amount) !== 13 || rows[0].currency !== 'TRY') {
    throw new Error('Payment readback mismatch.');
  }
  console.log('PASS payment-create-read');
  const repeated = await request('/rest/v1/rpc/record_payment_idempotent', { token, method: 'POST', body: payload });
  if (repeated.id !== paymentId) throw new Error('Payment idempotency returned a different id.');
  console.log('PASS payment-idempotency');
  await request('/rest/v1/rpc/record_payment_idempotent', {
    token, method: 'POST', body: { ...payload, p_amount: '14.00' }, expected: [400, 409],
  });
  console.log('PASS payment-idempotency-conflict');
  const updated = await request(path, {
    token, method: 'PATCH', body: { amount: '14.00', paid_at: '2026-10-11T12:00:00.000Z' }, represent: true,
  });
  if (!Array.isArray(updated) || updated.length !== 1 || Number(updated[0].amount) !== 14) {
    throw new Error('Payment edit failed.');
  }
  console.log('PASS payment-edit');
} finally {
  if (paymentId) {
    await request(`/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}`, { token, method: 'DELETE', expected: [204] });
    const remaining = await request(`/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}&select=id`, { token });
    if (!Array.isArray(remaining) || remaining.length !== 0) throw new Error('Temporary payment remained after cleanup.');
    console.log('PASS payment-cleanup');
  }
  if (subscriptionId) {
    await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`, { token, method: 'DELETE', expected: [204] });
    const remaining = await request(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id`, { token });
    if (!Array.isArray(remaining) || remaining.length !== 0) throw new Error('Temporary subscription remained after cleanup.');
    console.log('PASS subscription-cleanup');
  }
}
