import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { ExportScreen } from '../../../src/features/settings/ui/ExportScreen';

/** Verileri dışa aktar. Sekme çubuğunda görünmez; gizlilik merkezinden açılır. */
export default function ExportRoute() {
  useThemeRevision();
  return <ExportScreen />;
}
