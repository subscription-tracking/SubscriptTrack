/**
 * Same-account, two-session Supabase Realtime smoke check.
 * Requires Expo Supabase env vars, S31 test credentials, and
 * S31_SMOKE_CONFIRM=run. Creates one temporary subscription and removes it.
 * This does not replace cross-account RLS validation.
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const {
  EXPO_PUBLIC_SUPABASE_URL: url,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
  S31_TEST_EMAIL: email,
  S31_TEST_PASSWORD: password,
} = process.env;

if (!url || !key || !email || !password || process.env.S31_SMOKE_CONFIRM !== 'run') {
  throw new Error('Supabase test credentials and S31_SMOKE_CONFIRM=run are required.');
}

const makeClient = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const writer = makeClient();
const observer = makeClient();
const marker = `Realtime smoke ${randomUUID()}`;
const today = new Date().toISOString().slice(0, 10);
let subscriptionId;
let channel;

try {
  const [writerSession, observerSession] = await Promise.all([
    writer.auth.signInWithPassword({ email, password }),
    observer.auth.signInWithPassword({ email, password }),
  ]);
  const writerUserId = writerSession.data.user?.id;
  const observerUserId = observerSession.data.user?.id;
  if (writerSession.error || observerSession.error || !writerUserId || writerUserId !== observerUserId) {
    throw new Error('Two independent test-account sessions could not be established.');
  }
  console.log('PASS two-independent-sessions');

  let resolveChange;
  let rejectChange;
  const receivedChange = new Promise((resolve, reject) => {
    resolveChange = resolve;
    rejectChange = reject;
  });
  const subscribed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime subscribe timed out.')), 15_000);
    channel = observer
      .channel(`s31-realtime-${randomUUID()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${writerUserId}`,
      }, (change) => {
        if (change.new?.name === marker) resolveChange(change);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          clearTimeout(timeout);
          const error = new Error(`Realtime channel ${status}.`);
          reject(error);
          rejectChange(error);
        }
      });
  });
  await subscribed;

  const created = await writer.rpc('create_subscription_idempotent', {
    p_idempotency_key: `s31-realtime-${randomUUID()}`,
    p_name: marker,
    p_amount: '1.00',
    p_currency: 'TRY',
    p_billing_cycle: 'monthly',
    p_start_date: today,
    p_next_renewal_date: today,
    p_category: 'other',
    p_notes: 'Temporary same-account Realtime check',
    p_payment_method: null,
    p_trial_end_date: null,
    p_trial_price_after: null,
  });
  if (created.error || !created.data?.id) {
    throw created.error ?? new Error('Fixture create RPC did not return an id.');
  }
  subscriptionId = created.data.id;
  await Promise.race([
    receivedChange,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Realtime INSERT was not observed within 15 seconds.')), 15_000)),
  ]);
  console.log('PASS observer-received-insert');
} finally {
  if (subscriptionId) {
    const { error } = await writer.from('subscriptions').delete().eq('id', subscriptionId);
    if (error) throw error;
    const { data, error: readError } = await writer.from('subscriptions').select('id').eq('id', subscriptionId);
    if (readError || data?.length) throw readError ?? new Error('Temporary Realtime fixture remained after cleanup.');
    console.log('PASS fixture-cleanup');
  }
  if (channel) {
    await Promise.race([
      observer.removeChannel(channel),
      new Promise((resolve) => setTimeout(resolve, 1_000)),
    ]);
  }
  writer.realtime.disconnect();
  observer.realtime.disconnect();
  await Promise.all([writer.auth.signOut(), observer.auth.signOut()]);
}

// Some Node versions keep the native WebSocket event loop alive after a clean
// Supabase channel shutdown. All assertions and cleanup above are complete.
process.exit(0);
