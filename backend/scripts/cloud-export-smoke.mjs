/** One-time cloud export check on an empty test-account export namespace. */
import { randomUUID } from 'node:crypto';

const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account configuration is required.');
if (process.env.S31_SMOKE_CONFIRM !== 'run') throw new Error('Refusing remote mutation without S31_SMOKE_CONFIRM=run.');

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
const existingJobs = await request('/rest/v1/exports?select=id', token);
const existingObjects = await request('/storage/v1/object/list/exports', token, 'POST', { prefix: `${userId}/`, limit: 100 });
if (!Array.isArray(existingJobs) || !Array.isArray(existingObjects)) throw new Error('Export preflight was invalid.');
if (existingJobs.length !== 0 || existingObjects.length !== 0) {
  throw new Error('Test account already has an export; refusing to overwrite it.');
}
console.log('PASS empty-export-preflight');

const payload = { p_idempotency_key: `expo-export-smoke-${randomUUID()}` };
const job = await request('/rest/v1/rpc/request_export_idempotent', token, 'POST', payload);
if (!job?.id || job.status !== 'PENDING') throw new Error('Export RPC did not return a pending job.');
console.log('PASS export-rpc');
const repeated = await request('/rest/v1/rpc/request_export_idempotent', token, 'POST', payload);
if (repeated.id !== job.id) throw new Error('Export idempotency returned a different id.');
console.log('PASS export-idempotency');

const processed = await request('/functions/v1/process-export', token, 'POST', { export_id: job.id });
if (processed.id !== job.id || processed.status !== 'READY' || typeof processed.download_url !== 'string') {
  throw new Error('Export Function did not return a ready signed download.');
}
const signed = new URL(processed.download_url);
if (signed.origin !== new URL(base).origin || !signed.pathname.includes('/storage/v1/object/sign/exports/')) {
  throw new Error('Export download URL did not use the expected private bucket.');
}
console.log('PASS process-export-ready');

const download = await fetch(signed);
if (!download.ok) throw new Error(`Signed CSV download returned HTTP ${download.status}`);
const csv = await download.text();
const lines = csv.trimEnd().split(/\r?\n/);
const header = lines[0].replaceAll('"', '');
const expected = 'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after';
if (header !== expected || lines.length < 2) throw new Error('Downloaded CSV schema or row count was invalid.');
console.log(`PASS signed-csv-download rows=${lines.length - 1}`);

const jobs = await request(`/rest/v1/exports?id=eq.${encodeURIComponent(job.id)}&select=id,status,storage_path`, token);
if (!Array.isArray(jobs) || jobs.length !== 1 || jobs[0].status !== 'READY') throw new Error('Export row was not ready.');
const objects = await request('/storage/v1/object/list/exports', token, 'POST', { prefix: `${userId}/`, limit: 100 });
if (!Array.isArray(objects) || objects.length !== 1) throw new Error('Private export object was not visible.');
console.log('PASS export-row-and-private-object');
console.log('INFO one private latest.csv test artifact retained in the test account');
