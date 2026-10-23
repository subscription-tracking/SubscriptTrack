import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { PaymentHistoryScreen } from '../../../src/features/stats/ui/PaymentHistoryScreen';

/** Ödeme geçmişi. Sekme çubuğunda görünmez; istatistikten açılır. */
export default function PaymentHistoryRoute() {
  useThemeRevision();
  return <PaymentHistoryScreen />;
}
