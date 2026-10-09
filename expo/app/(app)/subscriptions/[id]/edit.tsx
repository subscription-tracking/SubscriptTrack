import { useLocalSearchParams } from 'expo-router';

import { SubscriptionEditScreen } from '../../../../src/features/subscriptions/ui/SubscriptionEditScreen';

/** Abonelik düzenleme. Sekme çubuğunda görünmez; detay ekranındaki "Düzenle" ile açılır. */
export default function SubscriptionEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SubscriptionEditScreen id={typeof id === 'string' ? id : ''} />;
}
