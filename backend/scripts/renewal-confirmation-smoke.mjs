/**
 * Live authenticated smoke for the Expo "confirm renewed" sequence.
 * Creates one temporary overdue subscription, records a payment, proves an
 * invalid subscription update leaves the payment visible, retries the update
 * with the same idempotency keys, writes the renewal event, and cleans up.
 * Idempotency rows expire server-side after 24 hours.
 *
 * Requires SUPABASE_URL, SUPABASE_ANON_KEY, S31_TEST_EMAIL and
 * S31_TEST_PASSWORD. Remote writes require S31_SMOKE_CONFIRM=run.
 */
import { randomUUID } from 'node:crypto';

const base = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !anon || !email || !password) {
  throw new Error('Test account configuration is required.');
}
if (process.env.S31_SMOKE_CONFIRM !== 'run') {
  throw new Error('Refusing remote mutation. Set S31_SMOKE_CONFIRM=run to execute.');
}

async function call(path, { method = 'GET', token, body, expected = [200], represent = false } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token ?? anon}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(represent ? { Prefer: 'return=representation' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!expected.includes(response.status)) {
    const failure = await response.json().catch(() => null);
    const code = typeof failure?.code === 'string' ? ` ${failure.code}` : '';
    const message = typeof failure?.message === 'string' ? `: ${failure.message}` : '';
    throw new Error(`${method} ${path.split('?')[0]} returned HTTP ${response.status}${code}${message}.`);
  }
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function plusDays(date, amount) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + amount);
  return dateString(result);
}

function nextMonthlyCycleAfter(dueDate, today) {
  const anchorDay = Number(dueDate.slice(-2));
  let year = Number(dueDate.slice(0, 4));
  let month = Number(dueDate.slice(5, 7)) - 1;
  do {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const candidate = dateString(new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay))));
    if (candidate > today) return candidate;
  } while (true);
}

async function cleanup(token, subscriptionId, paymentId, eventId) {
  const errors = [];
  if (eventId) {
    try { await call(`/rest/v1/subscription_events?id=eq.${encodeURIComponent(eventId)}`, { method: 'DELETE', token, expected: [204] }); }
    catch { errors.push('event delete'); }
  } else if (subscriptionId) {
    try { await call(`/rest/v1/subscription_events?subscription_id=eq.${encodeURIComponent(subscriptionId)}`, { method: 'DELETE', token, expected: [204] }); }
    catch { errors.push('event cleanup'); }
  }
  if (paymentId) {
    try { await call(`/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}`, { method: 'DELETE', token, expected: [204] }); }
    catch { errors.push('payment delete'); }
  }
  if (subscriptionId) {
    try { await call(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`, { method: 'DELETE', token, expected: [204] }); }
    catch { errors.push('subscription delete'); }
  }
  if (subscriptionId) {
    try {
      const [subscriptions, payments, events] = await Promise.all([
        call(`/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id`, { token }),
        call(`/rest/v1/payment_events?subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=id`, { token }),
        call(`/rest/v1/subscription_events?subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=id`, { token }),
      ]);
      if (subscriptions.length || payments.length || events.length) errors.push('readback found temporary rows');
    } catch { errors.push('cleanup readback'); }
  }
  if (errors.length) throw new Error(`Temporary data cleanup incomplete: ${errors.join(', ')}.`);
  console.log('PASS temporary-data-cleanup');
}

const session = await call('/auth/v1/token?grant_type=password', {
  method: 'POST', body: { email, password },
});
const token = session?.access_token;
const userId = session?.user?.id;
if (!token || !userId) throw new Error('Test account login failed.');

const today = dateString(new Date());
const dueDate = plusDays(today, -1);
const startDate = plusDays(dueDate, -30);
const nextDate = nextMonthlyCycleAfter(dueDate, today);
const marker = randomUUID();
const paymentKey = `renewal-smoke-payment-${marker}`;
const updateKey = `renewal-smoke-update-${marker}`;
let subscriptionId;
let paymentId;
let eventId;

try {
  const created = await call('/rest/v1/rpc/create_subscription_idempotent', {
    method: 'POST', token, body: {
      p_idempotency_key: `renewal-smoke-create-${marker}`,
      p_name: `Renewal smoke ${marker}`,
      p_amount: '7.19',
      p_currency: 'TRY',
      p_billing_cycle: 'monthly',
      p_start_date: startDate,
      p_next_renewal_date: dueDate,
      p_category: 'other',
      p_notes: 'Temporary renewal confirmation smoke record',
      p_payment_method: null,
      p_trial_end_date: null,
      p_trial_price_after: null,
    },
  });
  subscriptionId = created?.id;
  if (!subscriptionId) throw new Error('Temporary subscription was not created.');
  console.log('PASS temporary-overdue-subscription-created');

  const paidAt = new Date().toISOString();
  const paymentPayload = {
    p_idempotency_key: paymentKey,
    p_subscription_id: subscriptionId,
    p_amount: '7.19',
    p_currency: 'TRY',
    p_paid_at: paidAt,
  };
  const payment = await call('/rest/v1/rpc/record_payment_idempotent', {
    method: 'POST', token, body: paymentPayload,
  });
  paymentId = payment?.id;
  if (!paymentId) throw new Error('Payment RPC did not return an id.');
  const paymentRows = await call(
    `/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}&select=id,subscription_id,amount,currency,paid_at`,
    { token },
  );
  if (paymentRows.length !== 1 || paymentRows[0].subscription_id !== subscriptionId ||
      Number(paymentRows[0].amount) !== 7.19 || paymentRows[0].currency !== 'TRY') {
    throw new Error('Payment readback mismatch.');
  }
  console.log('PASS payment-recorded-and-readable');

  const updatePayload = {
    p_idempotency_key: updateKey,
    p_subscription_id: subscriptionId,
    p_name: created.name,
    p_amount: created.amount,
    p_currency: created.currency,
    p_billing_cycle: created.billing_cycle,
    p_start_date: created.start_date,
    p_next_renewal_date: nextDate,
    p_category: created.category,
    p_notes: created.notes,
    p_payment_method: created.payment_method,
    p_trial_end_date: created.trial_end_date,
    p_trial_price_after: created.trial_price_after,
    p_notification_rules: created.notification_rules ?? [],
    p_status: 'INVALID_SMOKE_STATUS',
  };
  await call('/rest/v1/rpc/update_subscription_idempotent', {
    method: 'POST', token, body: updatePayload, expected: [400, 409],
  });
  const afterRejectedUpdate = await call(
    `/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}&select=id,next_renewal_date`, { token },
  );
  const paymentAfterRejectedUpdate = await call(
    `/rest/v1/payment_events?id=eq.${encodeURIComponent(paymentId)}&select=id`, { token },
  );
  if (afterRejectedUpdate.length !== 1 || afterRejectedUpdate[0].next_renewal_date !== dueDate ||
      paymentAfterRejectedUpdate.length !== 1) {
    throw new Error('Rejected update did not leave date/payment in the expected partial state.');
  }
  console.log('PASS partial-failure-keeps-payment-and-old-date');

  const replay = await call('/rest/v1/rpc/record_payment_idempotent', {
    method: 'POST', token, body: paymentPayload,
  });
  if (replay?.id !== paymentId) throw new Error('Payment retry created a duplicate payment event.');
  console.log('PASS payment-retry-is-idempotent');

  const updated = await call('/rest/v1/rpc/update_subscription_idempotent', {
    method: 'POST', token,
    body: { ...updatePayload, p_status: created.status },
  });
  if (updated?.next_renewal_date !== nextDate) throw new Error('Renewal date retry did not advance to next cycle.');
  console.log('PASS subscription-update-retry-advances-next-cycle');

  const events = await call('/rest/v1/subscription_events?select=id', {
    method: 'POST', token, represent: true, expected: [201],
    body: {
      user_id: userId,
      subscription_id: subscriptionId,
      event_type: 'RENEWAL_ADVANCED',
      payload: { from_date: dueDate, to_date: nextDate },
    },
  });
  eventId = events?.[0]?.id;
  if (!eventId) throw new Error('Renewal event was not recorded.');
  const eventReadback = await call(
    `/rest/v1/subscription_events?id=eq.${encodeURIComponent(eventId)}&select=id,event_type,payload`, { token },
  );
  if (eventReadback.length !== 1 || eventReadback[0].event_type !== 'RENEWAL_ADVANCED' ||
      eventReadback[0].payload?.to_date !== nextDate) {
    throw new Error('Renewal event readback mismatch.');
  }
  console.log('PASS renewal-event-recorded-and-readable');
} finally {
  await cleanup(token, subscriptionId, paymentId, eventId);
}
