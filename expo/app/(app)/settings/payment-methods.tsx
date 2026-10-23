import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { PaymentMethodsScreen } from '../../../src/features/settings/ui/PaymentMethodsScreen';

/** Ödeme yöntemleri. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function PaymentMethodsRoute() {
  useThemeRevision();
  return <PaymentMethodsScreen />;
}
