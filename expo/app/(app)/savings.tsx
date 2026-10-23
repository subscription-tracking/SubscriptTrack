import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { SavingsScreen } from '../../src/features/savings/ui/SavingsScreen';

/** Tasarruf analizi. Sekme çubuğunda görünmez; istatistikten açılır. */
export default function SavingsRoute() {
  useThemeRevision();
  return <SavingsScreen />;
}
