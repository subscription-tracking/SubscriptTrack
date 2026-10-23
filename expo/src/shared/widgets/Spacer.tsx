import { useThemeRevision } from '../design/useThemeRevision';
import { View } from 'react-native';

/** Dikey boşluk. Ekranlarda satır içi `height` yerine bu kullanılır (Flutter `SizedBox(height)` karşılığı). */
export function Spacer({ size }: { size: number }) {
  useThemeRevision();
  return <View style={{ height: size }} />;
}
