/** Read-only deployment smoke check. Never prints tokens or response bodies. */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.SUPABASE_ANON_KEY
if (!base || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required')
const headers = { apikey: key, Authorization: `Bearer ${key}` }
const checks = [
  ['auth-settings', '/auth/v1/settings'],
  ['storage-api', '/storage/v1/bucket'],
  ['subscriptions-rest', '/rest/v1/subscriptions?select=id&limit=1'],
  ['exports-rest', '/rest/v1/exports?select=id,status&limit=1'],
]
let failed = false
for (const [name, path] of checks) {
  const response = await fetch(`${base}${path}`, { headers })
  const ok = response.status < 500 && response.status !== 404
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} HTTP ${response.status}`)
  if (!ok) failed = true
}
if (failed) process.exitCode = 1
