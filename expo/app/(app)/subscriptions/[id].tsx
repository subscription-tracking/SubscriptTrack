import { useLocalSearchParams } from 'expo-router';

import { SubscriptionDetailScreen } from '../../../src/features/subscriptions/ui/SubscriptionDetailScreen';

/** Abonelik detayı. Sekme çubuğunda görünmez; listeden açılır. */
export default function SubscriptionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SubscriptionDetailScreen id={typeof id === 'string' ? id : ''} />;
}
