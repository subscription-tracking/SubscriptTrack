// Dışa aktarma dosyaları için ortak yardımcılar (güvenlik denetimi F-02).
//
// Kullanıcı başına TEK sabit dosya (`<uid>/latest.csv`, upsert): bırakılan
// eski dosyalar birikmez. Hesap silinirken `<uid>/` altındaki her nesne
// kaldırılır.

export const EXPORT_BUCKET = 'exports'

export function exportPath(userId) {
  return `${userId}/latest.csv`
}

/**
 * Kullanıcının Storage'daki tüm dışa aktarma nesnelerini siler.
 * Hata olursa fırlatır (çağıran hesabı silmeden önce durmalı, kalıntı veri
 * bırakmamak için).
 */
export async function removeUserExports(admin, userId) {
  const bucket = admin.storage.from(EXPORT_BUCKET)
  const { data, error } = await bucket.list(userId, { limit: 1000 })
  if (error) throw error
  const paths = (data ?? []).filter((o) => o?.name).map((o) => `${userId}/${o.name}`)
  if (paths.length === 0) return 0
  const removed = await bucket.remove(paths)
  if (removed.error) throw removed.error
  return paths.length
}

/**
 * Başarılı dışa aktarmadan sonra kullanıcının diğer `exports` satırlarını siler
 * (migration 034 kullanıcı başına satır kotası uygular; kayıtlar birikmemeli).
 * En iyi çaba: hata olursa dışa aktarma sonucu etkilenmez, günlüğe yazılır.
 */
export async function pruneOtherExports(admin, userId, keepId) {
  const { error } = await admin.from('exports').delete().eq('user_id', userId).neq('id', keepId)
  if (error) console.error('[exports] eski kayıtlar silinemedi:', error.message ?? error)
  return !error
}
