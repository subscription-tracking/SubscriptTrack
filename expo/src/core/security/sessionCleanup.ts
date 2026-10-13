/**
 * Oturum kapanırken kullanıcıya ait yerel verinin temizlenmesi. `core` feature'ları import edemediği için
 * feature'lar kendi temizleyicisini buraya kaydeder; `AuthProvider` çıkışta/hesap silmede çalıştırır.
 * - `sign-out`: yerel abonelik verisi ve bildirim durumu silinir; kilit kaydı (kullanıcıya bağlı) kalır.
 * - `account-deleted`: kilit verisi dahil her şey silinir.
 */
export type SessionCleanupReason = 'sign-out' | 'account-deleted';
export type SessionCleaner = (userId: string, reason: SessionCleanupReason) => Promise<void>;

const cleaners = new Map<string, SessionCleaner>();

/** Aynı ad tekrar kaydedilirse öncekinin yerini alır (modül yeniden yüklemesinde çift kayıt olmaz). */
export function registerSessionCleaner(name: string, cleaner: SessionCleaner): void {
  cleaners.set(name, cleaner);
}

/** Tüm temizleyicileri çalıştırır; biri başarısız olsa da diğerleri sürer. Başarısız olanların adlarını döndürür. */
export async function runSessionCleanup(userId: string, reason: SessionCleanupReason): Promise<string[]> {
  const failed: string[] = [];
  await Promise.all([...cleaners].map(async ([name, cleaner]) => {
    try { await cleaner(userId, reason); } catch { failed.push(name); }
  }));
  return failed;
}
