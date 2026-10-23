import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'
import { csvField } from '../_shared/csv.js'
import { EXPORT_BUCKET, exportPath, pruneOtherExports } from '../_shared/exports.js'
import { internalError } from '../_shared/http.js'
import { checkRateLimit, tooManyRequests } from '../_shared/ratelimit.js'

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
  if (!(await checkRateLimit(admin, user.id, 'process-export'))) return tooManyRequests('process-export')
  try {
    const body = await req.json()
    const exportId = body?.export_id
    if (typeof exportId !== 'string') return new Response(JSON.stringify({ error: 'export_id gerekli' }), { status: 400, headers })
    const { data: job, error: jobError } = await admin.from('exports').select('*').eq('id', exportId).eq('user_id', user.id).single()
    if (jobError || !job) return new Response(JSON.stringify({ error: 'Export bulunamadı' }), { status: 404, headers })
    // A retry must still return a usable download URL. Expired jobs are rebuilt
    // through the same owner-filtered query rather than returning a stale link.
    if (job.status === 'READY' && job.download_url && Date.parse(job.expires_at) > Date.now()) {
      return new Response(JSON.stringify(job), { status: 200, headers })
    }
    const { data: rows, error } = await admin.from('subscriptions').select('*').eq('user_id', user.id).is('deleted_at', null).order('next_renewal_date')
    if (error) throw error
    const headersRow = ['name','amount','currency','billing_cycle','next_renewal_date','category','status','notes','payment_method','trial_end_date','trial_price_after']
    const moneyValue = (value: unknown) => {
      if (value && typeof value === 'object' && 'minorUnits' in (value as Record<string, unknown>)) {
        return ((value as Record<string, unknown>).minorUnits as number / 100).toFixed(2)
      }
      return String(value ?? '')
    }
    // Kullanıcı metni (ad, not, ödeme yöntemi…) Excel'de formül olarak çalışmasın
    // diye etkisizleştirilir (CSV injection); tutar ve tarih sütunları olduğu gibi yazılır.
    const numeric = { text: false }
    const csv = [headersRow.map((h) => csvField(h, numeric)).join(','), ...rows.map((r: Record<string, unknown>) => [
      csvField(r.name), csvField(moneyValue(r.amount), numeric), csvField(r.currency),
      csvField(r.billing_cycle), csvField(r.next_renewal_date, numeric),
      csvField(r.category), csvField(r.status), csvField(r.notes), csvField(r.payment_method),
      csvField(r.trial_end_date, numeric), csvField(moneyValue(r.trial_price_after), numeric),
    ].join(','))].join('\r\n') + '\r\n'
    const path = exportPath(user.id)
    const upload = await admin.storage.from(EXPORT_BUCKET).upload(path, new Blob([csv], { type: 'text/csv; charset=utf-8' }), { upsert: true, contentType: 'text/csv; charset=utf-8' })
    if (upload.error) throw upload.error
    const signed = await admin.storage.from(EXPORT_BUCKET).createSignedUrl(path, 60 * 60)
    if (signed.error) throw signed.error
    const { data: updated, error: updateError } = await admin.from('exports').update({ status: 'READY', storage_path: path, download_url: signed.data.signedUrl, expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), error_message: null }).eq('id', exportId).eq('user_id', user.id).select().single()
    if (updateError) throw updateError
    // Satır birikmesini önle (034 kotası): kullanıcının yalnızca en güncel dışa aktarma kaydı kalır.
    await pruneOtherExports(admin, user.id, exportId)
    return new Response(JSON.stringify(updated), { status: 200, headers })
  } catch (error) {
    return internalError(error, 'process-export')
  }
})
