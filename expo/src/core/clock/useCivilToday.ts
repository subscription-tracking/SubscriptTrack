import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { addDays, formatCivilDate, parseCivilDate, zonedHourToUtc, zoneToday } from '../time/calendar';

/** Snapshot is a civil-day string: ordinary renders do not reset the date clock. */
export function useCivilToday(timeZone: string) {
  const snapshot = useCallback(() => formatCivilDate(zoneToday(timeZone)), [timeZone]);
  const subscribe = useCallback((changed: () => void) => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      const next = zonedHourToUtc(addDays(zoneToday(timeZone), 1), 0, timeZone).getTime();
      timer = setTimeout(() => { changed(); schedule(); }, Math.max(1000, next - Date.now() + 1));
    };
    schedule();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') { changed(); schedule(); }
    });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [timeZone]);
  const civil = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => parseCivilDate(civil)!, [civil]);
}
