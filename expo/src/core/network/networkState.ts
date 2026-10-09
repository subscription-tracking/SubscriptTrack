/**
 * Ağ durumu yorumu. `expo-network` bilinmeyen değerleri `undefined` bırakabilir; bilinmeyen
 * durum çevrimiçi kabul edilir ve gerçek bir istek hatası offline davranışını tetikler.
 * I/O yoktur.
 */
export interface NetworkSnapshot {
  isConnected?: boolean;
  isInternetReachable?: boolean;
}

export function isOnline(snapshot: NetworkSnapshot | null | undefined): boolean {
  if (!snapshot) return true;
  return snapshot.isConnected !== false && snapshot.isInternetReachable !== false;
}
