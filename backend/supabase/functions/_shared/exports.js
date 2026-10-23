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
  const paths = []
  const prefixes = [userId]
  // Enumerate before deleting: deleting while using an offset skips later objects.
  for (const prefix of prefixes) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
      if (error) throw error
      for (const object of data ?? []) {
        if (!object?.name || object.name === '.' || object.name === '..' || object.name.includes('/')) throw new Error('Invalid export object name')
        const path = `${prefix}/${object.name}`
        if (object.id === null) prefixes.push(path)
        else paths.push(path)
      }
      if ((data?.length ?? 0) < 1000) break
    }
  }
  if (paths.length === 0) return 0
  for (let offset = 0; offset < paths.length; offset += 1000) {
    const removed = await bucket.remove(paths.slice(offset, offset + 1000))
    if (removed.error) throw removed.error
  }
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
