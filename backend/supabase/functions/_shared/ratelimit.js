// Kullanıcı başına uygulama düzeyinde hız sınırı (Edge Function'lar ve Node testleri ortak kullanır).
//
// Sayaç `public.check_rate_limit` RPC'sinde tutulur (migration 032); yalnızca
// service_role çağırabilir. Sabit pencere: pencere dolunca sayaç sıfırlanır.
//
// Kasıtlı tasarım: sayaç veritabanına ulaşılamazsa istek **geçirilir** (fail-open)
// ve hata günlüğe yazılır; hız sınırı bir kötüye kullanım önlemidir, bu yüzden
// altyapı sorununun kullanıcıları kilitlememesi tercih edilmiştir.

export const LIMITS = {
  'delete-account': { limit: 3, windowSeconds: 3600 },
  'process-export': { limit: 10, windowSeconds: 3600 },
  'support-catalog:post': { limit: 10, windowSeconds: 3600 },
  'support-catalog:get': { limit: 120, windowSeconds: 3600 },
  'payment-methods:put': { limit: 60, windowSeconds: 3600 },
  'payment-methods:get': { limit: 240, windowSeconds: 3600 },
}

/** `true`: istek geçebilir, `false`: sınır aşıldı. */
export async function checkRateLimit(admin, userId, bucket, config = LIMITS[bucket], log = console.error) {
  if (!config) throw new Error(`Bilinmeyen hız sınırı kovası: ${bucket}`)
  try {
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_user_id: userId,
      p_bucket: bucket,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    })
    if (error) throw error
    return data !== false
  } catch (cause) {
    log('rate limit check failed (fail-open)', cause)
    return true
  }
}

export function tooManyRequests(bucket, headers = {}) {
  const config = LIMITS[bucket]
  return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': String(config ? config.windowSeconds : 3600),
      ...headers,
    },
  })
}
