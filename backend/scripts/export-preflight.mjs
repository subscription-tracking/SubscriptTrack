/** Read-only inventory before any cloud export test; prints counts only. */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account configuration is required.');

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${token ?? key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`${method} ${path.split('?')[0]} returned HTTP ${response.status}`);
  return response.json();
}

const session = await request('/auth/v1/token?grant_type=password', null, 'POST', { email, password });
const token = session.access_token;
const userId = session.user?.id;
if (!token || !userId) throw new Error('Test account login failed.');
const exports = await request('/rest/v1/exports?select=id,status', token);
if (!Array.isArray(exports)) throw new Error('Export rows were not an array.');
console.log(`INFO visible-export-rows ${exports.length}`);
const objects = await request('/storage/v1/object/list/exports', token, 'POST', { prefix: `${userId}/`, limit: 100 });
if (!Array.isArray(objects)) throw new Error('Storage object listing was not an array.');
console.log(`INFO visible-export-objects ${objects.length}`);
