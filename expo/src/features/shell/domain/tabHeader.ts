/**
 * Sekme üst barının metinleri (Flutter `AppShell._topBarFor` ve `_months`/`_days` karşılığı).
 * Gün kısaltmaları Flutter ile aynıdır: Pz, Pt, Sa, Ça, Pe, Cu, Ct (Dart `weekday % 7` indeksi = JS `getDay()`).
 */

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

const DAYS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'] as const;

/** "Pt, 9 Ekim" biçimi. */
export function homeDateLabel(now: Date): string {
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

/** Görünen ad varsa "Merhaba, Furkan"; yoksa yalnızca "Merhaba". E-posta öneki ad yerine kullanılmaz. */
export function greetingFor(user: { displayName: string | null } | null): string {
  const name = user?.displayName?.trim() ?? '';
  return name.length > 0 ? `Merhaba, ${name}` : 'Merhaba';
}

/** "3 aktif abonelik" */
export function activeSubtitle(count: number): string {
  return `${count} aktif abonelik`;
}
