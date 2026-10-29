import { Alert } from 'react-native';

import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { advancedRenewalDate } from '../domain/renewalOverdue';
import { type Subscription } from '../domain/subscription';
import { useRenewAction } from './useRenewAction';

/**
 * Onaylı "Ödendi" eylemi: kısa bir onay penceresinden sonra yenilemeyi onaylar. Ana sayfadaki "Dikkat
 * gerektirenler" ve bildirim merkezi aynı kancayı kullanır; `pendingId` işlem süren aboneliktir.
 */
export function useConfirmedRenew(today: CivilDate) {
  const renew = useRenewAction();
  const pendingId = renew.isPending ? renew.variables?.id : undefined;

  const confirm = (subscription: Subscription) => {
    if (renew.isPending) return;
    confirmRenewal(subscription, today, () => renew.mutate(subscription));
  };

  return { confirm, pendingId };
}

/** Ortak açık onay; aynı onay penceresinden tekrar gönderimi engeller. */
export function confirmRenewal(subscription: Subscription, today: CivilDate, onConfirm: () => void) {
  const next = advancedRenewalDate(subscription, today);
  let submitted = false;
  Alert.alert(`${subscription.name} ödendi mi?`, next ? `Ödemeyi yaptığını işaretleyeceksin. Yenileme tarihi ${formatLongDate(next)} olacak.` : 'Ödemeyi yaptığını işaretleyeceksin. Yenileme tarihi güncellenecek.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Ödendi', onPress: () => { if (!submitted) { submitted = true; onConfirm(); } } },
  ]);
}
