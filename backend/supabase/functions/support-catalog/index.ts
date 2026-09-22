import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = { 'Content-Type': 'application/json' }

Deno.serve(async (req: Request) => {
  const auth = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!service) return new Response(JSON.stringify({ error: 'Sunucu yapılandırma hatası' }), { status: 503, headers })
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Geçersiz token' }), { status: 401, headers })
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  if (req.method === 'GET') {
    const { data, error } = await admin.from('service_catalog').select('id,name,category').eq('is_active', true).order('sort_order')
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers })
    return new Response(JSON.stringify({ services: data ?? [] }), { status: 200, headers })
  }
  if (req.method === 'POST') {
    const body = await req.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const category = typeof body?.category === 'string' ? body.category.trim() : 'general'
    if (!message || message.length > 2000) return new Response(JSON.stringify({ error: 'Mesaj 1-2000 karakter olmalı' }), { status: 400, headers })
    const { data, error } = await admin.from('support_tickets').insert({ user_id: user.id, category, message }).select('id,status,created_at').single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers })
    return new Response(JSON.stringify(data), { status: 201, headers })
  }
  return new Response(JSON.stringify({ error: 'Yalnızca GET ve POST desteklenir' }), { status: 405, headers })
})
