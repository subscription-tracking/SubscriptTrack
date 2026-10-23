import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { Stack } from 'expo-router';

/** Oturum açmamış kullanıcının ekranları. Başlık çubuğu her ekranın kendi başlığını taşır. */
export default function AuthLayout() {
  useThemeRevision();
  return <Stack screenOptions={{ headerShown: false }} />;
}
