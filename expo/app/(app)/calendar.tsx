import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { CalendarScreen } from '../../src/features/calendar/ui/CalendarScreen';

/** Takvim sekmesi: aylık yenileme ve deneme görünümü. */
export default function CalendarTabScreen() {
  useThemeRevision();
  return <CalendarScreen />;
}
