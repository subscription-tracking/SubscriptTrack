/** Temporary authenticated read_at round-trip on one test-account notification. */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account configuration is required.');
if (process.env.S31_SMOKE_CONFIRM !== 'run') throw new Error('Refusing remote mutation without S31_SMOKE_CONFIRM=run.');

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`${method} returned HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const session = await request('/auth/v1/token?grant_type=password', null, 'POST', { email, password });
const token = session.access_token;
if (!token) throw new Error('Test account login failed.');
const unread = await request('/rest/v1/notifications?select=id,read_at&read_at=is.null&limit=1', token);
if (!Array.isArray(unread)) throw new Error('Notification query returned invalid data.');
if (unread.length === 0) {
  console.log('SKIP notification-read-roundtrip: no unread test notification');
  process.exit(0);
}

const id = unread[0].id;
const path = `/rest/v1/notifications?id=eq.${encodeURIComponent(id)}`;
let changed = false;
try {
  const marked = await request(`${path}&read_at=is.null`, token, 'PATCH', { read_at: new Date().toISOString() });
  changed = true;
  if (!Array.isArray(marked) || marked.length !== 1 || typeof marked[0].read_at !== 'string') {
    throw new Error('Read marker did not update one notification.');
  }
  const readback = await request(`${path}&select=read_at`, token);
  if (!Array.isArray(readback) || readback[0]?.read_at !== marked[0].read_at) {
    throw new Error('Read marker was not persisted.');
  }
  console.log('PASS notification-read-write-read');
} finally {
  if (changed) {
    const restored = await request(path, token, 'PATCH', { read_at: null });
    if (!Array.isArray(restored) || restored.length !== 1 || restored[0].read_at !== null) {
      throw new Error('Notification read marker could not be restored.');
    }
    console.log('PASS notification-read-restore');
  }
}
