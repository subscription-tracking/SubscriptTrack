import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import { ProfileScreen } from '../../../src/features/settings/ui/ProfileScreen';

/** Profil. Sekme çubuğunda görünmez; ayarlardan açılır. */
export default function ProfileRoute() {
  useThemeRevision();
  return <ProfileScreen />;
}
