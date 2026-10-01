import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { recentlyAuthenticated } from '../supabase/functions/_shared/auth.js'

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (payload) => `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`
const NOW = 1_800_000_000_000

test('yakın zamanda giriş yapılmış oturum kabul edilir', () => {
  const t = NOW / 1000 - 60
  assert.equal(recentlyAuthenticated(`Bearer ${jwt({ amr: [{ method: 'password', timestamp: t }] })}`, NOW), true)
})

test('eski giriş (token yenilense bile) reddedilir', () => {
  const t = NOW / 1000 - 3600
  assert.equal(recentlyAuthenticated(jwt({ iat: NOW / 1000 - 10, amr: [{ method: 'password', timestamp: t }] }), NOW), false)
})

test('en yeni amr girdisi sayılır', () => {
  const amr = [{ method: 'otp', timestamp: NOW / 1000 - 9999 }, { method: 'password', timestamp: NOW / 1000 - 30 }]
  assert.equal(recentlyAuthenticated(jwt({ amr }), NOW), true)
})

test('amr yok, bozuk veya gelecekte olan jeton reddedilir', () => {
  assert.equal(recentlyAuthenticated(jwt({}), NOW), false)
  assert.equal(recentlyAuthenticated('bozuk', NOW), false)
  assert.equal(recentlyAuthenticated('', NOW), false)
  assert.equal(recentlyAuthenticated(jwt({ amr: [{ timestamp: NOW / 1000 + 86400 }] }), NOW), false)
})

test('delete-account kimlik doğrulamadan sonra, silmeden önce yakın giriş ister', async () => {
  const da = await readFile(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8')
  assert.match(da, /recentlyAuthenticated\(authHeader\)/)
  assert.ok(da.indexOf('getUser()') < da.indexOf('recentlyAuthenticated('))
  assert.ok(da.indexOf('recentlyAuthenticated(') < da.indexOf('deleteUser('))
})
