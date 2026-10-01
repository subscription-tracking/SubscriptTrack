import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { exportPath, removeUserExports } from '../supabase/functions/_shared/exports.js'

function fakeAdmin({ files = [], listError = null, removeError = null } = {}) {
  const calls = { list: [], remove: [] }
  return {
    calls,
    storage: {
      from: () => ({
        list: async (prefix) => { calls.list.push(prefix); return { data: files, error: listError } },
        remove: async (paths) => { calls.remove.push(paths); return { error: removeError } },
      }),
    },
  }
}

test('export yolu kullanıcı başına sabittir (birikim yok)', () => {
  assert.equal(exportPath('u1'), 'u1/latest.csv')
  assert.equal(exportPath('u1'), exportPath('u1'))
})

test('hesap silinirken kullanıcının tüm nesneleri kaldırılır', async () => {
  const admin = fakeAdmin({ files: [{ name: 'latest.csv' }, { name: 'old-123.csv' }] })
  assert.equal(await removeUserExports(admin, 'u1'), 2)
  assert.deepEqual(admin.calls.list, ['u1'])
  assert.deepEqual(admin.calls.remove, [['u1/latest.csv', 'u1/old-123.csv']])
})

test('nesne yoksa remove çağrılmaz', async () => {
  const admin = fakeAdmin()
  assert.equal(await removeUserExports(admin, 'u1'), 0)
  assert.equal(admin.calls.remove.length, 0)
})

test('Storage hatası fırlatılır (hesap silme durmalı)', async () => {
  await assert.rejects(removeUserExports(fakeAdmin({ listError: new Error('x') }), 'u1'))
  await assert.rejects(removeUserExports(fakeAdmin({ files: [{ name: 'a' }], removeError: new Error('y') }), 'u1'))
})

test('process-export sabit yolu, delete-account temizliği kullanır', async () => {
  const pe = await readFile(new URL('../supabase/functions/process-export/index.ts', import.meta.url), 'utf8')
  const da = await readFile(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8')
  assert.match(pe, /exportPath\(user\.id\)/)
  assert.doesNotMatch(pe, /\$\{exportId\}\.csv/)
  assert.match(da, /await removeUserExports\(adminClient, user\.id\)/)
  assert.ok(da.indexOf('removeUserExports(adminClient') < da.indexOf('admin.deleteUser'), 'önce dosyalar, sonra kullanıcı')
})

test('Edge Function içe aktarmaları tam sürüme sabitlenmiştir (F-10)', async () => {
  const { readdir } = await import('node:fs/promises')
  const base = new URL('../supabase/functions/', import.meta.url)
  for (const dir of await readdir(base, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith('_')) continue
    const src = await readFile(new URL(`${dir.name}/index.ts`, base), 'utf8')
    for (const m of src.matchAll(/https:\/\/esm\.sh\/([^'"\s]+)/g)) {
      assert.match(m[1], /@\d+\.\d+\.\d+$/, `${dir.name}: ${m[1]} sabitlenmemiş`)
    }
  }
})

test('eski export satırları budanır, hata sonucu bozmaz (034 kotası)', async () => {
  const { pruneOtherExports } = await import('../supabase/functions/_shared/exports.js')
  const calls = []
  const chain = (result) => {
    const q = { delete: () => q, eq: (k, v) => { calls.push(['eq', k, v]); return q }, neq: (k, v) => { calls.push(['neq', k, v]); return Promise.resolve(result) } }
    return q
  }
  assert.equal(await pruneOtherExports({ from: () => chain({ error: null }) }, 'u1', 'e9'), true)
  assert.deepEqual(calls, [['eq', 'user_id', 'u1'], ['neq', 'id', 'e9']])
  assert.equal(await pruneOtherExports({ from: () => chain({ error: { message: 'x' } }) }, 'u1', 'e9'), false)
  const src = await readFile(new URL('../supabase/functions/process-export/index.ts', import.meta.url), 'utf8')
  assert.match(src, /await pruneOtherExports\(admin, user\.id, exportId\)/)
})
