import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { PrivacyCenterScreen } from '../../../src/features/settings/ui/PrivacyCenterScreen';

/** Gizlilik merkezi. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function PrivacyRoute() {
  useThemeRevision();
  return <PrivacyCenterScreen />;
}
