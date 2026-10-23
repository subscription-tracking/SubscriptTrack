/**
 * Authenticated Expo migration contract probe. Reads only after obtaining a
 * test-account session; never prints credentials, tokens or response bodies.
 * No subscription, profile, export or account mutations are performed.
 */
const base = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account and publishable Supabase configuration are required.');

async function call(name, path, token, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}`);
  console.log(`PASS ${name} HTTP ${response.status}`);
  return response.json();
}

const auth = await call('test-account-session', '/auth/v1/token?grant_type=password', null, {
  method: 'POST', body: JSON.stringify({ email, password }),
});
const token = auth.access_token;
const userId = auth.user?.id;
if (typeof token !== 'string' || typeof userId !== 'string') throw new Error('Test account session was incomplete.');

const profile = await call('profile-fields',
  `/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,timezone,default_notify_days,push_enabled&limit=1`, token);
if (!Array.isArray(profile) || profile.length !== 1 || profile[0].user_id !== userId) {
  throw new Error('Test account profile was missing or did not match the authenticated user.');
}
const anonymousProfiles = await call('anonymous-profile-isolation', '/rest/v1/profiles?select=user_id&limit=1');
if (!Array.isArray(anonymousProfiles) || anonymousProfiles.length !== 0) {
  throw new Error('Anonymous profile isolation failed.');
}

for (const [name, path] of [
  ['subscriptions-read', '/rest/v1/subscriptions?select=id,status,next_renewal_date&limit=1'],
  ['notifications-read', '/rest/v1/notifications?select=id,read_at&limit=1'],
  ['exports-read', '/rest/v1/exports?select=id,status&limit=1'],
  ['payment-events-read', '/rest/v1/payment_events?select=id&limit=1'],
]) {
  const rows = await call(name, path, token);
  if (!Array.isArray(rows)) throw new Error(`${name} response was invalid.`);
}

const catalog = await call('service-catalog-function', '/functions/v1/support-catalog', token);
if (!Array.isArray(catalog.services)) throw new Error('Service catalog response was invalid.');

const schemaResponse = await fetch(`${base}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${token}`, Accept: 'application/openapi+json' },
});
if (schemaResponse.ok) {
  const schema = await schemaResponse.json();
  const exportRpcListed = Object.keys(schema.paths ?? {}).some((path) => path.endsWith('/rpc/request_export_idempotent'));
  console.log(`INFO authenticated-openapi-export-rpc-listed ${exportRpcListed}`);
} else {
  console.log(`INFO authenticated-openapi-unavailable HTTP ${schemaResponse.status}`);
}
