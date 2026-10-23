import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { NotificationCenterScreen } from '../../src/features/notifications/ui/NotificationCenterScreen';

/** Bildirim merkezi. Sekme çubuğunda görünmez; ana sayfadaki bildirim düğmesinden açılır. */
export default function NotificationsRoute() {
  useThemeRevision();
  return <NotificationCenterScreen />;
}
