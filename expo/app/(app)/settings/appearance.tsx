import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { AppearanceScreen } from '../../../src/features/settings/ui/AppearanceScreen';

/** Görünüm. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function AppearanceRoute() {
  useThemeRevision();
  return <AppearanceScreen />;
}
