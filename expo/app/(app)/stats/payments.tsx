import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { PaymentHistoryScreen } from '../../../src/features/stats/ui/PaymentHistoryScreen';
import { useLocalSearchParams } from 'expo-router';

/** Ödeme geçmişi. Sekme çubuğunda görünmez; istatistikten açılır. */
export default function PaymentHistoryRoute() {
  useThemeRevision();
  const { subscriptionId } = useLocalSearchParams<{ subscriptionId?: string | string[] }>();
  const id = typeof subscriptionId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(subscriptionId) ? subscriptionId : undefined;
  return <PaymentHistoryScreen subscriptionId={id} />;
}
