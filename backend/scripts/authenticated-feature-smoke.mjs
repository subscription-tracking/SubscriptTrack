/**
 * Authenticated smoke checks for payment labels and support/service catalog.
 * Requires SUPABASE_URL, SUPABASE_ANON_KEY, S31_TEST_EMAIL, S31_TEST_PASSWORD.
 * No credentials or response bodies are printed. Mutating checks require
 * S31_SMOKE_CONFIRM=run and restore the original payment labels afterwards.
 */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !anon || !email || !password) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, S31_TEST_EMAIL and S31_TEST_PASSWORD are required.');
if (process.env.S31_SMOKE_CONFIRM !== 'run') throw new Error('Refusing remote mutation. Set S31_SMOKE_CONFIRM=run to execute.');

async function call(path, { method = 'GET', token, body, expected = [200] } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { apikey: anon, Authorization: `Bearer ${token ?? anon}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!expected.includes(response.status)) throw new Error(`${method} ${path} returned HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const session = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
const token = session.access_token;
if (!token) throw new Error('Authenticated session did not return an access token.');
console.log('PASS authenticated-session');

const original = await call('/functions/v1/payment-methods', { token });
const marker = `S31 smoke ${Date.now()}`;
try {
  const saved = await call('/functions/v1/payment-methods', { method: 'PUT', token, body: { methods: [...(original.methods ?? []), marker] } });
  if (!saved.methods?.includes(marker)) throw new Error('Payment label write did not round-trip.');
  console.log('PASS payment-label-write-read');
  const catalog = await call('/functions/v1/support-catalog', { token });
  if (!Array.isArray(catalog.services)) throw new Error('Service catalog response is invalid.');
  console.log('PASS service-catalog-read');
  const ticket = await call('/functions/v1/support-catalog', {
    method: 'POST', token, body: { category: 'smoke', message: `Temporary smoke ticket ${marker}` }, expected: [201],
  });
  if (!ticket.id) throw new Error('Support ticket response did not include an id.');
  console.log('PASS support-ticket-create');
} finally {
  await call('/functions/v1/payment-methods', { method: 'PUT', token, body: { methods: original.methods ?? [] } });
  console.log('PASS payment-label-restore');
}
