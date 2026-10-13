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
    const next = advancedRenewalDate(subscription, today);
    Alert.alert(
      `${subscription.name} ödendi mi?`,
      next ? `Yenileme tarihi ${formatLongDate(next)} olacak.` : 'Yenileme tarihi güncellenecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ödendi', onPress: () => renew.mutate(subscription) },
      ],
    );
  };

  return { confirm, pendingId };
}
