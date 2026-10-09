import type { SubscriptionStatus } from './subscription';

/**
 * Abonelik durum çipinin metni ve tonu (Flutter `SubscriptionStatusChip._state` ile aynı).
 * Ton UI'da renge çevrilir; bu dosya saf mantıktır.
 */

export type ChipTone = 'primary' | 'warning' | 'error' | 'trial' | 'muted' | 'success';

export interface StatusChipState {
  label: string;
  tone: ChipTone;
}

export function statusChipState(input: {
  status: SubscriptionStatus;
  isNotStarted: boolean;
  daysUntilRenewal: number | null;
}): StatusChipState {
  if (input.isNotStarted) return { label: 'Henüz başlamadı', tone: 'warning' };
  const urgency = urgencyState(input.status, input.daysUntilRenewal);
  if (urgency) return urgency;
  switch (input.status) {
    case 'trial':
      return { label: 'Deneme', tone: 'trial' };
    case 'active':
      return { label: 'Aktif', tone: 'primary' };
    case 'paused':
      return { label: 'Duraklatıldı', tone: 'muted' };
    case 'cancelled':
      return { label: 'İptal edildi', tone: 'success' };
    case 'archived':
      return { label: 'Arşivlendi', tone: 'muted' };
    case 'expired':
      return { label: 'Süresi doldu', tone: 'error' };
  }
}

/** Aktif aboneliğin yenilemeye yakınlığına göre uyarı; diğer durumlarda `null`. */
function urgencyState(status: SubscriptionStatus, days: number | null): StatusChipState | null {
  if (status !== 'active' || days === null) return null;
  if (days < 0) return { label: 'Gecikmiş', tone: 'error' };
  if (days === 0) return { label: 'Bugün yenileniyor', tone: 'error' };
  if (days <= 3) return { label: 'Yakında yenileniyor', tone: 'warning' };
  return null;
}
