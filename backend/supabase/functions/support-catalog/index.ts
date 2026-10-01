// Supabase Edge Function — support-catalog
// GET: aktif servis kataloğu. POST: kullanıcı adına destek kaydı oluşturur.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'
import { corsHeaders, internalError, jsonResponse, normalizeCategory } from '../_shared/http.js'
import { checkRateLimit, tooManyRequests } from '../_shared/ratelimit.js'

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const auth = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!service) return jsonResponse({ error: 'Sunucu yapılandırma hatası' }, 503, cors)
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return jsonResponse({ error: 'Geçersiz token' }, 401, cors)
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

  if (req.method === 'GET') {
    if (!(await checkRateLimit(admin, user.id, 'support-catalog:get'))) {
      return tooManyRequests('support-catalog:get', cors)
    }
    const { data, error } = await admin.from('service_catalog').select('id,name,category').eq('is_active', true).order('sort_order')
    if (error) return internalError(error, 'support-catalog GET', cors)
    return jsonResponse({ services: data ?? [] }, 200, cors)
  }

  if (req.method === 'POST') {
    if (!(await checkRateLimit(admin, user.id, 'support-catalog:post'))) {
      return tooManyRequests('support-catalog:post', cors)
    }
    let body: Record<string, unknown> | null = null
    try {
      body = await req.json()
    } catch (_) {
      return jsonResponse({ error: 'Geçersiz JSON' }, 400, cors)
    }
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    if (!message || message.length > 2000) return jsonResponse({ error: 'Mesaj 1-2000 karakter olmalı' }, 400, cors)
    const category = normalizeCategory(body?.category)
    if (category === null) return jsonResponse({ error: 'Kategori en fazla 60 karakterlik metin olmalı' }, 400, cors)
    const { data, error } = await admin.from('support_tickets').insert({ user_id: user.id, category, message }).select('id,status,created_at').single()
    if (error) return internalError(error, 'support-catalog POST', cors)
    return jsonResponse(data, 201, cors)
  }

  return jsonResponse({ error: 'Yalnızca GET ve POST desteklenir' }, 405, cors)
})
