import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { AppLockSettingsScreen } from '../../../src/features/settings/ui/AppLockSettingsScreen';

/** Uygulama kilidi ayarları. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function AppLockRoute() {
  useThemeRevision();
  return <AppLockSettingsScreen />;
}
