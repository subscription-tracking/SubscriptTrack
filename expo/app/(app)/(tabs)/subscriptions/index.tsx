import { useThemeRevision } from '../../../../src/shared/design/useThemeRevision';
import { SubscriptionListScreen } from '../../../../src/features/subscriptions/ui/SubscriptionListScreen';
import { TabScaffold } from '../../../../src/features/shell/ui/TabScaffold';

/** Abonelikler sekmesi. */
export default function SubscriptionsTab() {
  useThemeRevision();
  return (
    <TabScaffold tab="subscriptions">
      <SubscriptionListScreen />
    </TabScaffold>
  );
}
