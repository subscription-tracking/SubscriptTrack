import { useLocalSearchParams } from 'expo-router';

import { SubscriptionCancelScreen } from '../../../../src/features/subscriptions/ui/SubscriptionCancelScreen';

/** İptal seçenekleri. Sekme çubuğunda görünmez; detaydaki "İptal" aksiyonundan açılır. */
export default function SubscriptionCancelRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SubscriptionCancelScreen id={typeof id === 'string' ? id : ''} />;
}
