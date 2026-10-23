import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { NotificationPreferencesScreen } from '../../../src/features/notifications/ui/NotificationPreferencesScreen';

/** Bildirim tercihleri. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function NotificationPreferencesRoute() {
  useThemeRevision();
  return <NotificationPreferencesScreen />;
}
