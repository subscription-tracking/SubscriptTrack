import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = { 'Content-Type': 'application/json' }

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Sadece POST desteklenir' }), { status: 405, headers })
  const auth = req.headers.get('Authorization')
  if (!auth) return new Response(JSON.stringify({ error: 'Authorization header eksik' }), { status: 401, headers })
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!serviceKey) return new Response(JSON.stringify({ error: 'Sunucu yapılandırma hatası' }), { status: 503, headers })
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Geçersiz token' }), { status: 401, headers })
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  try {
    const body = await req.json()
    const exportId = body?.export_id
    if (typeof exportId !== 'string') return new Response(JSON.stringify({ error: 'export_id gerekli' }), { status: 400, headers })
    const { data: job, error: jobError } = await admin.from('exports').select('id,status').eq('id', exportId).eq('user_id', user.id).single()
    if (jobError || !job) return new Response(JSON.stringify({ error: 'Export bulunamadı' }), { status: 404, headers })
    if (job.status === 'READY') return new Response(JSON.stringify(job), { status: 200, headers })
    const { data: rows, error } = await admin.from('subscriptions').select('*').eq('user_id', user.id).order('next_renewal_date')
    if (error) throw error
    const csv = ['id,name,amount,currency,billing_cycle,category,status,next_renewal_date,notes', ...rows.map((r: Record<string, unknown>) => [r.id,r.name,r.amount,r.currency,r.billing_cycle,r.category,r.status,r.next_renewal_date,r.notes].map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))].join('\r\n') + '\r\n'
    const path = `${user.id}/${exportId}.csv`
    const upload = await admin.storage.from('exports').upload(path, new Blob([csv], { type: 'text/csv; charset=utf-8' }), { upsert: true, contentType: 'text/csv; charset=utf-8' })
    if (upload.error) throw upload.error
    const signed = await admin.storage.from('exports').createSignedUrl(path, 60 * 60)
    if (signed.error) throw signed.error
    const { data: updated, error: updateError } = await admin.from('exports').update({ status: 'READY', storage_path: path, download_url: signed.data.signedUrl, expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), error_message: null }).eq('id', exportId).eq('user_id', user.id).select().single()
    if (updateError) throw updateError
    return new Response(JSON.stringify(updated), { status: 200, headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers })
  }
})
