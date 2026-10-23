import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { DeleteAccountScreen } from '../../../src/features/settings/ui/DeleteAccountScreen';

/** Hesabı sil. Sekme çubuğunda görünmez; gizlilik merkezinden açılır. */
export default function DeleteAccountRoute() {
  useThemeRevision();
  return <DeleteAccountScreen />;
}
