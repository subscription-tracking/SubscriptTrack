import type { CivilDate } from '../../../core/time/calendar';

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

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;

/** Kullanıcının bölgesinde çözülmüş takvim gününü gösterir. */
export function homeDateLabel(today: CivilDate): string {
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  return `${today.day} ${MONTHS[today.month - 1]} ${DAYS[weekday]}`;
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
