import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { SubscriptionArchivedScreen } from '../../../src/features/subscriptions/ui/SubscriptionArchivedScreen';

/** Arşivlenmiş abonelikler. Sekme çubuğunda görünmez; abonelik listesinden açılır. */
export default function SubscriptionArchivedRoute() {
  useThemeRevision();
  return <SubscriptionArchivedScreen />;
}
