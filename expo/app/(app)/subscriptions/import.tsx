import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { CsvImportScreen } from '../../../src/features/subscriptions/ui/CsvImportScreen';

/** CSV içe aktarma. Sekme çubuğunda görünmez; filtre sayfasından açılır. */
export default function CsvImportRoute() {
  useThemeRevision();
  return <CsvImportScreen />;
}
