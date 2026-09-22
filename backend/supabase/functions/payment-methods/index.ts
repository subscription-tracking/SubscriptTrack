// Kullanıcıya ait ödeme yöntemi etiketleri için authenticated API sınırı.
// Deploy: supabase functions deploy payment-methods --no-verify-jwt=false
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
}

const secret = (name: string) => (Deno.env.get(name) ?? '').trim()

function error(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers })
}

function normalizeMethods(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 40) return null
  const methods = value.map((item) => typeof item === 'string' ? item.trim() : '')
  if (methods.some((item) => item.length < 1 || item.length > 80)) return null
  const identities = methods.map((item) => item.toLocaleLowerCase('tr-TR'))
  if (new Set(identities).size !== identities.length) return null
  return methods
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return error('Sadece GET ve PUT desteklenir', 405)
  }

  const authHeader = req.headers.get('Authorization')?.trim()
  if (!authHeader) return error('Authorization header eksik', 401)

  const url = secret('SUPABASE_URL')
  const anonKey = secret('SUPABASE_ANON_KEY')
  const serviceKey = secret('SUPABASE_SERVICE_ROLE_KEY') || secret('SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return error('Sunucu yapılandırma hatası', 503)

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return error('Geçersiz token', 401)

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    if (req.method === 'GET') {
      const { data, error: readError } = await admin
        .from('payment_methods')
        .select('name')
        .eq('user_id', user.id)
        .order('created_at')
      if (readError) throw readError
      return new Response(JSON.stringify({ methods: data.map((row) => row.name) }), { headers })
    }

    const body = await req.json()
    const methods = normalizeMethods(body?.methods)
    if (methods == null) {
      return error('Ödeme yöntemleri 1-80 karakterlik, benzersiz en fazla 40 ad olmalıdır', 400)
    }
    const { error: replaceError } = await admin.rpc('replace_payment_methods', {
      p_user_id: user.id,
      p_names: methods,
    })
    if (replaceError) throw replaceError
    return new Response(JSON.stringify({ methods }), { headers })
  } catch (cause) {
    console.error('payment-methods failed', cause)
    return error('Ödeme yöntemleri şu anda kaydedilemedi', 502)
  }
})
