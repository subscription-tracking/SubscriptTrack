import { type CivilDate, addDays, daysBetween, formatCivilDate, zoneToday, zonedHourToUtc } from '../../../core/time/calendar';
import { type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Yerel hatırlatma planlayıcısı (Flutter `ReminderPlanner` ile aynı kurallar,
 * [NOTIFICATIONS §5–6](../../../../../docs/architecture/NOTIFICATIONS.md)). Saf fonksiyon:
 * platform yok, takvim ve saat girdi olarak verilir.
 *
 * - Yenileme: kayıttaki bildirim kuralları (etkin olanlar) veya varsayılan gün sayısı.
 * - Deneme: bitişten 7, 3 ve 1 gün önce.
 * - Teslimat saati yerel 09:00; geçmiş zamanlı adaylar elenir.
 * - Bir iOS/Android sınırı için en fazla `limit` (60) bildirim; en yakınlar korunur.
 * - Yedek (catch-up): yenileme bugünse ama teslim saati geçtiyse (`st:c|`) ya da tarih geçmişte kaldıysa
 *   (`st:o|`, günde en fazla bir) now+60 sn tek seferlik bildirim; normal adaylardan önce gelir.
 * - Kimlik (`identifier`) abonelik + gün + tarih içerir; aynı plan aynı kimliği üretir (tekrar yok).
 */

export const REMINDER_LIMIT = 60;
export const REMINDER_HOUR = 9;
export const TRIAL_REMINDER_DAYS = [7, 3, 1] as const;
export const IDENTIFIER_PREFIX = 'st:';
/** Yedek bildirimin now'a göre gecikmesi (saniye). */
export const CATCH_UP_DELAY_SECONDS = 60;

export interface NotificationRuleValue {
  daysBefore: number;
  enabled: boolean;
}

export interface PlannedReminder {
  identifier: string;
  title: string;
  body: string;
  /** Yerel saatte teslim zamanı. */
  scheduled: Date;
  subscriptionId: string;
  /** IANA bölgesi; aynı UTC anına denk gelse bile bölge değişimi cihaz planını yeniler. */
  timeZone: string;
}

export interface PlanInput {
  /** Aktif kayıtlar (yenileme hatırlatması). */
  active: Subscription[];
  /** Deneme kayıtları (bitiş hatırlatması). */
  trials: Subscription[];
  /** Kayıtta kural yoksa kullanılan varsayılan gün sayısı (profil ayarı). */
  defaultDays: number;
  /** Şu an; bu andan önceki teslimler planlanmaz. */
  now: Date;
  /** Kullanıcının IANA saat dilimi; 09:00 bu bölgeye göre hesaplanır. */
  timeZone: string;
  hour?: number;
  limit?: number;
  /** Daha önce planlanmış yedek bildirim kimlikleri (`st:c|`, `st:o|`); bunlar yeniden üretilmez. */
  sentMarkers?: ReadonlySet<string>;
}

/** Kural listesinden etkin gün sayıları (tekil, artan). Kural hiç yoksa varsayılan. */
export function renewalDaysFor(rules: NotificationRuleValue[], defaultDays: number): number[] {
  if (rules.length === 0) return [defaultDays];
  return [...new Set(rules.filter((rule) => rule.enabled).map((rule) => rule.daysBefore))].sort((a, b) => a - b);
}

/** Yerel saatte teslim zamanı. */
function deliveryAt(day: CivilDate, hour: number, timeZone: string): Date {
  return zonedHourToUtc(day, hour, timeZone);
}

function identifierFor(subscriptionId: string, days: number, day: CivilDate, kind: 'r' | 't'): string {
  return `${IDENTIFIER_PREFIX}${kind}|${subscriptionId}|${days}|${formatCivilDate(day)}`;
}

const catchUpIdentifier = (id: string, day: CivilDate) => `${IDENTIFIER_PREFIX}c|${id}|${formatCivilDate(day)}`;
const overdueIdentifier = (id: string, today: CivilDate) => `${IDENTIFIER_PREFIX}o|${id}|${formatCivilDate(today)}`;

/** Yedek bildirim adayı: kullanıcının gününe göre yenileme bugün (saat geçmiş) ya da geçmişte kalmış aktif kayıt. */
function catchUpFor(subscription: Subscription, input: PlanInput, hour: number, today: CivilDate): PlannedReminder | null {
  const renewal = subscription.nextRenewalDate;
  if (!renewal) return null;
  const rules = subscription.notificationRules.filter(isRule);
  if (renewalDaysFor(rules, input.defaultDays).length === 0) return null;
  const late = daysBetween(renewal, today);
  if (late < 0) return null;
  const sent = input.sentMarkers;
  const scheduled = new Date(input.now.getTime() + CATCH_UP_DELAY_SECONDS * 1000);
  const amount = `${subscription.amount.decimalString} ${subscription.currency}`;
  const base = { title: subscription.name, scheduled, subscriptionId: subscription.id, timeZone: input.timeZone };
  if (late === 0) {
    if (deliveryAt(renewal, hour, input.timeZone).getTime() >= input.now.getTime()) return null;
    const identifier = catchUpIdentifier(subscription.id, renewal);
    if (sent?.has(identifier)) return null;
    return { ...base, identifier, body: `${renewalBody(0, amount)} · ${formatCivilDate(renewal)}` };
  }
  const identifier = overdueIdentifier(subscription.id, today);
  if (sent?.has(identifier)) return null;
  return { ...base, identifier, body: `Vadesi geçti — ${amount} · ${formatCivilDate(renewal)}. Ödemeyi kontrol et.` };
}

function renewalBody(days: number, amount: string): string {
  return days === 0 ? `Bugün yenileniyor — ${amount}` : `${days} gün içinde yenileniyor — ${amount}`;
}

export function planReminders(input: PlanInput): PlannedReminder[] {
  const hour = input.hour ?? REMINDER_HOUR;
  const limit = input.limit ?? REMINDER_LIMIT;
  const candidates: PlannedReminder[] = [];
  const catchUps: PlannedReminder[] = [];
  const today = zoneToday(input.timeZone, input.now);

  for (const subscription of input.active) {
    const catchUp = catchUpFor(subscription, input, hour, today);
    if (catchUp) catchUps.push(catchUp);
    if (!subscription.nextRenewalDate) continue;
    const rules = subscription.notificationRules.filter(isRule);
    for (const days of renewalDaysFor(rules, input.defaultDays)) {
      const day = addDays(subscription.nextRenewalDate, -days);
      const scheduled = deliveryAt(day, hour, input.timeZone);
      if (scheduled.getTime() < input.now.getTime()) continue;
      const amount = `${subscription.amount.decimalString} ${subscription.currency}`;
      candidates.push({
        identifier: identifierFor(subscription.id, days, day, 'r'),
        title: subscription.name,
        body: `${renewalBody(days, amount)} · ${formatCivilDate(subscription.nextRenewalDate)}`,
        scheduled,
        subscriptionId: subscription.id,
        timeZone: input.timeZone,
      });
    }
  }

  for (const subscription of input.trials) {
    if (!subscription.trialEndDate) continue;
    for (const days of TRIAL_REMINDER_DAYS) {
      const day = addDays(subscription.trialEndDate, -days);
      const scheduled = deliveryAt(day, hour, input.timeZone);
      if (scheduled.getTime() < input.now.getTime()) continue;
      candidates.push({
        identifier: identifierFor(subscription.id, days, subscription.trialEndDate, 't'),
        title: `${subscription.name} denemesi sona eriyor`,
        body: `Ücretsiz denemenin bitmesine ${days} gün kaldı. · ${(subscription.trialPriceAfter ?? subscription.amount).decimalString} ${subscription.currency} · ${formatCivilDate(subscription.trialEndDate)}`,
        scheduled,
        subscriptionId: subscription.id,
        timeZone: input.timeZone,
      });
    }
  }

  const byTime = (a: PlannedReminder, b: PlannedReminder) => a.scheduled.getTime() - b.scheduled.getTime() || a.identifier.localeCompare(b.identifier);
  // Yedek bildirimler 60 sınırında önceliklidir.
  return [...catchUps.sort(byTime), ...candidates.sort(byTime)].slice(0, limit);
}

function isRule(value: unknown): value is NotificationRuleValue {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.daysBefore === 'number' && typeof record.enabled === 'boolean' && record.daysBefore >= 0 && record.daysBefore <= 30;
}

/** Ertele aksiyonunun gecikmesi (dakika). Bildirimdeki "30 dk ertele" düğmesi bunu kullanır. */
export const SNOOZE_MINUTES = 30;
/** Ertelenmiş tek seferlik bildirimlerin kimlik öneki. Planlayıcı bunlara dokunmaz. */
export const SNOOZE_IDENTIFIER_PREFIX = 'st:z|';

/** Planlayıcının yönettiği kimlik mi (yenileme `st:r|`, deneme `st:t|`)? Ertelenmiş bildirimler hariç. */
export function isPlannedIdentifier(identifier: string): boolean {
  return /^st:[rtco]\|/.test(identifier);
}

/** Tek seferlik yedek bildirim kimliği mi (bugün-geçmiş `st:c|` ya da gecikmiş `st:o|`)? */
export function isCatchUpIdentifier(identifier: string): boolean {
  return /^st:[co]\|/.test(identifier);
}

/** Saat dilimi değiştiyse (önceki kayıtlı değer ile şimdiki cihaz değeri farklıysa) planı yenilemek gerekir. */
export function timezoneChanged(stored: string | null, current: string): boolean {
  return stored !== current;
}
