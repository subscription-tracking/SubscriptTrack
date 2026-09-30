import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import {
  corsHeaders, internalError, normalizeCategory, GENERIC_ERROR, MAX_CATEGORY_LENGTH,
} from '../supabase/functions/_shared/http.js';
import { checkRateLimit, tooManyRequests, LIMITS } from '../supabase/functions/_shared/ratelimit.js';

const fnDir = new URL('../supabase/functions/', import.meta.url);

test('CORS yalnızca izinli kaynağı yansıtır, asla * döndürmez', () => {
  const pages = corsHeaders('https://subscription-tracking.github.io');
  assert.equal(pages['Access-Control-Allow-Origin'], 'https://subscription-tracking.github.io');
  assert.equal(corsHeaders('http://localhost:8082')['Access-Control-Allow-Origin'], 'http://localhost:8082');
  assert.equal(corsHeaders('http://127.0.0.1')['Access-Control-Allow-Origin'], 'http://127.0.0.1');
  for (const origin of ['https://evil.example', 'http://localhost.evil.example', 'null', '', undefined, null]) {
    const h = corsHeaders(origin);
    assert.equal(h['Access-Control-Allow-Origin'], undefined, `izin verilmemeli: ${origin}`);
    assert.equal(h.Vary, 'Origin');
  }
});

test('normalizeCategory: varsayılan, kırpma, tip ve uzunluk sınırı', () => {
  assert.equal(normalizeCategory(undefined), 'general');
  assert.equal(normalizeCategory(null), 'general');
  assert.equal(normalizeCategory('   '), 'general');
  assert.equal(normalizeCategory('  Özellik isteği '), 'Özellik isteği');
  assert.equal(normalizeCategory('a'.repeat(MAX_CATEGORY_LENGTH)), 'a'.repeat(MAX_CATEGORY_LENGTH));
  assert.equal(normalizeCategory('a'.repeat(MAX_CATEGORY_LENGTH + 1)), null);
  assert.equal(normalizeCategory(42), null);
  assert.equal(normalizeCategory({}), null);
});

test('internalError ham hata metnini istemciye sızdırmaz, günlüğe yazar', async () => {
  const logged = [];
  const secret = new Error('relation "profiles" does not exist; password=hunter2');
  const res = internalError(secret, 'unit', { 'X-Test': '1' }, (...args) => logged.push(args));
  assert.equal(res.status, 500);
  assert.equal(res.headers.get('X-Test'), '1');
  const text = await res.text();
  assert.equal(JSON.parse(text).error, GENERIC_ERROR);
  assert.ok(!text.includes('hunter2') && !text.includes('profiles'));
  assert.equal(logged.length, 1);
  assert.equal(logged[0][1], secret);
});

test('checkRateLimit: doğru argümanlarla RPC çağırır, sınır aşılınca false döner', async () => {
  const calls = [];
  const admin = (data) => ({ rpc: async (name, args) => { calls.push([name, args]); return { data, error: null }; } });
  assert.equal(await checkRateLimit(admin(true), 'u1', 'delete-account'), true);
  assert.deepEqual(calls[0], ['check_rate_limit', {
    p_user_id: 'u1', p_bucket: 'delete-account', p_limit: LIMITS['delete-account'].limit,
    p_window_seconds: LIMITS['delete-account'].windowSeconds,
  }]);
  assert.equal(await checkRateLimit(admin(false), 'u1', 'delete-account'), false);
});

test('checkRateLimit: sayaç hatasında fail-open ve günlük; bilinmeyen kova hata', async () => {
  const logged = [];
  const broken = { rpc: async () => ({ data: null, error: new Error('db down') }) };
  assert.equal(await checkRateLimit(broken, 'u1', 'process-export', undefined, (...a) => logged.push(a)), true);
  assert.equal(logged.length, 1);
  const throwing = { rpc: async () => { throw new Error('network'); } };
  assert.equal(await checkRateLimit(throwing, 'u1', 'process-export', undefined, () => {}), true);
  await assert.rejects(() => checkRateLimit(broken, 'u1', 'yok-kova'), /Bilinmeyen/);
});

test('tooManyRequests 429 ve Retry-After döner', async () => {
  const res = tooManyRequests('delete-account', { 'Access-Control-Allow-Origin': 'https://subscription-tracking.github.io' });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), String(LIMITS['delete-account'].windowSeconds));
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://subscription-tracking.github.io');
  assert.match((await res.json()).error, /Çok fazla istek/);
});

test('her Edge Function hız sınırı uygular ve iç hata / joker CORS kullanmaz', async () => {
  const dirs = (await readdir(fnDir, { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith('_'));
  assert.equal(dirs.length, 4);
  for (const d of dirs) {
    const src = await readFile(new URL(`${d.name}/index.ts`, fnDir), 'utf8');
    assert.match(src, /checkRateLimit\(/, `${d.name}: hız sınırı yok`);
    assert.doesNotMatch(src, /Access-Control-Allow-Origin'?:\s*'\*'/, `${d.name}: joker CORS`);
    assert.doesNotMatch(src, /String\((err|error)\)/, `${d.name}: ham hata metni sızıyor`);
    assert.doesNotMatch(src, /error\.message/, `${d.name}: error.message istemciye dönebilir`);
  }
});

test('032 hız sınırı migration: yalnızca service_role, RLS açık, cascade', async () => {
  const sql = await readFile(new URL('../migrations/032_rate_limits.sql', import.meta.url), 'utf8');
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON TABLE public\.rate_limits FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.check_rate_limit\(uuid, text, integer, integer\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.check_rate_limit\(uuid, text, integer, integer\) TO service_role;/);
  assert.match(sql, /SECURITY DEFINER SET search_path = public/);
  assert.match(sql, /REFERENCES auth\.users\(id\) ON DELETE CASCADE/);
  assert.doesNotMatch(sql, /DROP (TABLE|POLICY)/i);
});
