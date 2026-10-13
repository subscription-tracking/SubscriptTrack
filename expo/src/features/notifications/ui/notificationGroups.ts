import { type CivilDate, dayNumber, zoneToday } from '../../../core/time/calendar';
import { isRenewalDue } from '../../subscriptions/domain/renewalOverdue';
import { type Subscription } from '../../subscriptions/domain/subscription';

export type NotificationGroupTitle = 'Bugün' | 'Dün' | 'Bu hafta' | 'Daha eski';

/** Bildirimin oluşturulma gününe göre bölüm başlığı (kullanıcının saat diliminde takvim günü farkı). */
export function groupTitleFor(createdAt: string, now: Date, timeZone: string): NotificationGroupTitle {
  const diff = dayNumber(zoneToday(timeZone, now)) - dayNumber(zoneToday(timeZone, new Date(createdAt)));
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  if (diff < 7) return 'Bu hafta';
  return 'Daha eski';
}

const ORDER: readonly NotificationGroupTitle[] = ['Bugün', 'Dün', 'Bu hafta', 'Daha eski'];

/** Öğeleri gün gruplarına ayırır; boş gruplar atlanır, grup içi sıra korunur. */
export function groupByDay<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date,
  timeZone: string,
): { title: NotificationGroupTitle; data: T[] }[] {
  const buckets = new Map<NotificationGroupTitle, T[]>();
  for (const item of items) {
    const title = groupTitleFor(item.createdAt, now, timeZone);
    buckets.set(title, [...(buckets.get(title) ?? []), item]);
  }
  return ORDER.filter((title) => buckets.has(title)).map((title) => ({ title, data: buckets.get(title) ?? [] }));
}

/** Tekrarlar tek satırda toplanmış bildirim: en yeni kayıt temsilcidir, `ids` grubun tüm kimlikleridir. */
export interface CollapsedNotification<T> {
  item: T;
  ids: string[];
  count: number;
}

/**
 * Aynı abonelik ve türdeki bildirimleri tek satıra toplar (sunucu tekrar üretebilir). Abonelik kimliği olmayan
 * kayıtlar toplanmaz. En yeni kayıt temsilcidir; sıra ilk görülme sırasını korur.
 */
export function collapseDuplicates<T extends { id: string; kind: string; subscriptionId: string | null; createdAt: string }>(
  items: readonly T[],
): CollapsedNotification<T>[] {
  const groups = new Map<string, CollapsedNotification<T>>();
  const order: string[] = [];
  for (const item of items) {
    const key = item.subscriptionId ? `${item.subscriptionId}|${item.kind}` : `single|${item.id}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { item, ids: [item.id], count: 1 });
      order.push(key);
    } else {
      existing.ids.push(item.id);
      existing.count += 1;
      if (Date.parse(item.createdAt) > Date.parse(existing.item.createdAt)) existing.item = item;
    }
  }
  return order.map((key) => groups.get(key) as CollapsedNotification<T>);
}

/** Satır içi eylemler: yenileme türünde "Ödendi" + "Aboneliği aç", deneme türünde yalnız "Aboneliği aç". */
export interface RowActions {
  canPay: boolean;
}

/**
 * Bildirim satırında eylem satırı çıkar mı? Yalnızca abonelik bulunuyorsa ve yenileme/deneme tarihi geldiyse;
 * silinmiş, bulunamayan ya da vadesi gelmemiş aboneliklerde `null`.
 */
export function rowActionsFor(kind: string, subscription: Subscription | undefined, today: CivilDate): RowActions | null {
  if (!subscription || !isRenewalDue(subscription, today)) return null;
  return { canPay: kind.startsWith('renewal') };
}
