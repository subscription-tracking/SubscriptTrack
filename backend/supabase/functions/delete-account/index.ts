// Supabase Edge Function — delete-account
// Çağıran kullanıcının hesabını ve tüm verilerini kalıcı olarak siler.
//
// Deploy:
//   supabase functions deploy delete-account --no-verify-jwt=false
//
// Ortam değişkenleri (Supabase Dashboard > Edge Functions > Secrets):
//   SUPABASE_URL       — otomatik inject
//   SUPABASE_SERVICE_ROLE_KEY — manuel ekle (service_role key)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'
import { removeUserExports } from '../_shared/exports.js'
import { corsHeaders, internalError, jsonResponse } from '../_shared/http.js'
import { checkRateLimit, tooManyRequests } from '../_shared/ratelimit.js'

const requiredSecret = (name: string) => (Deno.env.get(name) ?? '').trim()

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get('Origin'))

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Sadece POST desteklenir' }, 405, { ...cors, Allow: 'POST, OPTIONS' })
  }

  try {
    // 1. İsteği yapan kullanıcıyı JWT ile doğrula
    const authHeader = req.headers.get('Authorization')?.trim()
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization header eksik' }, 401, cors)
    }

    // Kullanıcı client — JWT'den user_id çıkarmak için
    const userClient = createClient(
      requiredSecret('SUPABASE_URL'),
      requiredSecret('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Geçersiz token' }, 401, cors)
    }

    // 2. Admin client — service_role key ile kullanıcı sil
    const serviceRoleKey = requiredSecret('SUPABASE_SERVICE_ROLE_KEY') ||
      requiredSecret('SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      console.error('Service role secret yapılandırılmamış')
      return jsonResponse({ error: 'Sunucu yapılandırma hatası' }, 503, cors)
    }

    const adminClient = createClient(
      requiredSecret('SUPABASE_URL'),
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    if (!(await checkRateLimit(adminClient, user.id, 'delete-account'))) {
      return tooManyRequests('delete-account', cors)
    }

    // Storage'daki dışa aktarma dosyaları tablo cascade'ine dahil değildir;
    // kullanıcı silinmeden önce kaldırılır (hata olursa hesap silinmez, tekrar denenir).
    await removeUserExports(adminClient, user.id)

    // Subscriptions cascade ile silinir (ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return internalError(deleteError, 'delete-account', cors)
    }

    return jsonResponse({ success: true }, 200, cors)
  } catch (err) {
    return internalError(err, 'delete-account', cors)
  }
})
