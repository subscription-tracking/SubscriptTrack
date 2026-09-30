// HTTP yardımcıları (Edge Function'lar ve Node testleri ortak kullanır).
//
// - CORS: `Access-Control-Allow-Origin: *` yerine yalnızca bilinen web
//   kaynakları (GitHub Pages önizleme, yerel geliştirme) yansıtılır. Mobil
//   istemciler tarayıcı değildir, Origin göndermez ve CORS'a ihtiyaç duymaz.
// - Hata gizleme: iç hata metni (`String(err)`, `error.message`) istemciye
//   dönmez; sunucu günlüğüne yazılır, istemciye genel mesaj verilir.

export const ALLOWED_ORIGINS = ['https://subscription-tracking.github.io']
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

export const GENERIC_ERROR = 'Beklenmeyen bir hata oluştu'
export const MAX_CATEGORY_LENGTH = 60

/** İzinli bir tarayıcı kaynağını yansıtan CORS başlıkları. */
export function corsHeaders(origin, extra = {}) {
  const allowed = typeof origin === 'string' && (ALLOWED_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin))
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    ...extra,
  }
}

export function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

/** İç hatayı günlüğe yazar, istemciye yalnızca genel mesaj döner. */
export function internalError(cause, label, headers = {}, log = console.error) {
  log(`${label} failed`, cause)
  return jsonResponse({ error: GENERIC_ERROR }, 500, headers)
}

/** Destek kaydı kategorisi: metin, kırpılmış, 1–60 karakter; yoksa `general`. */
export function normalizeCategory(value) {
  if (value === undefined || value === null) return 'general'
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (text.length === 0) return 'general'
  return text.length <= MAX_CATEGORY_LENGTH ? text : null
}
