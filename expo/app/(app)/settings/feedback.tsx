import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { FeedbackScreen } from '../../../src/features/settings/ui/FeedbackScreen';

/** Geri bildirim ve destek. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function FeedbackRoute() {
  useThemeRevision();
  return <FeedbackScreen />;
}
