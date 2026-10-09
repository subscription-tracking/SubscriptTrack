import { type CivilDate, addDays, formatCivilDate } from '../../../core/time/calendar';
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
 * - Kimlik (`identifier`) abonelik + gün + tarih içerir; aynı plan aynı kimliği üretir (tekrar yok).
 */

export const REMINDER_LIMIT = 60;
export const REMINDER_HOUR = 9;
export const TRIAL_REMINDER_DAYS = [7, 3, 1] as const;
export const IDENTIFIER_PREFIX = 'st:';

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
  hour?: number;
  limit?: number;
}

/** Kural listesinden etkin gün sayıları (tekil, artan). Kural hiç yoksa varsayılan. */
export function renewalDaysFor(rules: NotificationRuleValue[], defaultDays: number): number[] {
  if (rules.length === 0) return [defaultDays];
  return [...new Set(rules.filter((rule) => rule.enabled).map((rule) => rule.daysBefore))].sort((a, b) => a - b);
}

/** Yerel saatte teslim zamanı. */
function deliveryAt(day: CivilDate, hour: number): Date {
  return new Date(day.year, day.month - 1, day.day, hour, 0, 0, 0);
}

function identifierFor(subscriptionId: string, days: number, day: CivilDate, kind: 'r' | 't'): string {
  return `${IDENTIFIER_PREFIX}${kind}|${subscriptionId}|${days}|${formatCivilDate(day)}`;
}

function renewalBody(days: number, amount: string): string {
  return days === 0 ? `Bugün yenileniyor — ${amount}` : `${days} gün içinde yenileniyor — ${amount}`;
}

export function planReminders(input: PlanInput): PlannedReminder[] {
  const hour = input.hour ?? REMINDER_HOUR;
  const limit = input.limit ?? REMINDER_LIMIT;
  const candidates: PlannedReminder[] = [];

  for (const subscription of input.active) {
    if (!subscription.nextRenewalDate) continue;
    const rules = subscription.notificationRules.filter(isRule);
    for (const days of renewalDaysFor(rules, input.defaultDays)) {
      const day = addDays(subscription.nextRenewalDate, -days);
      const scheduled = deliveryAt(day, hour);
      if (scheduled.getTime() < input.now.getTime()) continue;
      const amount = `${subscription.amount.decimalString} ${subscription.currency}`;
      candidates.push({
        identifier: identifierFor(subscription.id, days, day, 'r'),
        title: subscription.name,
        body: renewalBody(days, amount),
        scheduled,
        subscriptionId: subscription.id,
      });
    }
  }

  for (const subscription of input.trials) {
    if (!subscription.trialEndDate) continue;
    for (const days of TRIAL_REMINDER_DAYS) {
      const day = addDays(subscription.trialEndDate, -days);
      const scheduled = deliveryAt(day, hour);
      if (scheduled.getTime() < input.now.getTime()) continue;
      candidates.push({
        identifier: identifierFor(subscription.id, days, subscription.trialEndDate, 't'),
        title: `${subscription.name} denemesi sona eriyor`,
        body: `Ücretsiz denemenin bitmesine ${days} gün kaldı.`,
        scheduled,
        subscriptionId: subscription.id,
      });
    }
  }

  return candidates.sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime()).slice(0, limit);
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
  return /^st:[rt]\|/.test(identifier);
}

/** Saat dilimi değiştiyse (önceki kayıtlı değer ile şimdiki cihaz değeri farklıysa) planı yenilemek gerekir. */
export function timezoneChanged(stored: string | null, current: string): boolean {
  return stored !== current;
}
