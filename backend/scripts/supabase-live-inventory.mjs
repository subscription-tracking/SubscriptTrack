/**
 * Read-only Supabase live inventory.
 * Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/supabase-live-inventory.mjs
 * Never prints the key. REST cannot expose SQL metadata; 404 is reported as
 * "not visible via public REST", not as proof that the table does not exist.
 */
const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const tables = [
  'subscriptions', 'profiles', 'notifications', 'notification_rules',
  'renewal_occurrences', 'subscription_events', 'savings_events',
  'device_tokens', 'exports', 'payment_methods', 'payment_events',
  'idempotency_keys',
];

async function probe(path) {
  const response = await fetch(`${url}${path}`, { headers });
  return { status: response.status, reachable: response.ok };
}

const result = {
  generatedAt: new Date().toISOString(),
  projectUrl: url,
  authSettings: await probe('/auth/v1/settings'),
  storageBuckets: await probe('/storage/v1/bucket'),
  tables: Object.fromEntries(
    await Promise.all(tables.map(async (table) => [
      table, await probe(`/rest/v1/${table}?select=*&limit=1`),
    ])),
  ),
  limitation: 'Public REST probe cannot inspect columns, policies, triggers, cron or Realtime publication. Use an authenticated SQL/admin channel for those checks.',
};

console.log(JSON.stringify(result, null, 2));
