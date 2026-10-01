// Yakın zamanda kimlik doğrulama (güvenlik denetimi F-13).
//
// Hassas işlemler (hesap silme) için çalınmış/eski bir oturum yetmesin:
// JWT'nin `amr` (authentication methods reference) girdilerinden en yenisinin
// zaman damgası `maxAgeSeconds` içinde olmalıdır. Token yenilemek `amr`
// zaman damgasını değiştirmez; yani süre gerçek giriş anından sayılır.
// İstemci hesap silmeden önce parolayla yeniden giriş yapar (delete_account_screen).

export const RECENT_LOGIN_SECONDS = 5 * 60

function decodePayload(jwt) {
  try {
    const part = String(jwt ?? '').replace(/^Bearer\s+/i, '').split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/** `true`: son kimlik doğrulama [maxAgeSeconds] içinde. İmza doğrulaması `getUser()`'a aittir. */
export function recentlyAuthenticated(jwt, nowMs = Date.now(), maxAgeSeconds = RECENT_LOGIN_SECONDS) {
  const payload = decodePayload(jwt)
  const amr = Array.isArray(payload?.amr) ? payload.amr : []
  const times = amr.map((e) => Number(e?.timestamp)).filter((t) => Number.isFinite(t) && t > 0)
  if (times.length === 0) return false
  const age = nowMs / 1000 - Math.max(...times)
  return age >= -60 && age <= maxAgeSeconds
}
