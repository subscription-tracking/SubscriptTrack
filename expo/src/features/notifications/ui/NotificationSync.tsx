import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { zoneToday, deviceTimeZone, type CivilDate } from '../../../core/time/calendar';
import { activeForTotals, trialsByEnd } from '../../dashboard/domain/dashboardSummary';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { cancelAllReminders, configureNotifications, getLaunchTapSubscriptionId, subscribeToTaps, syncReminders } from '../data/notificationScheduler';
import { useNotifyPrefs } from '../data/notificationPrefs';
import { usePermissionQuery } from '../data/notificationPermission';
import { planReminders, timezoneChanged } from '../domain/reminderPlanner';
import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

const TIMEZONE_KEY = 'notifications.timezone';

/**
 * Oturum açıkken yerel hatırlatmaları abonelik verisiyle eşitler ve bildirime dokunmayı
 * abonelik detayına yönlendirir. Görsel öğesi yoktur.
 */
export function NotificationSync() {
  const router = useRouter();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const prefs = useNotifyPrefs();
  const permission = usePermissionQuery();
  // Uygulama öne her geldiğinde saat dilimi kontrol edilir; değiştiyse plan ve bugün yeniden hesaplanır.
  const [zoneTick, setZoneTick] = useState(0);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), [zoneTick]);
  const handledLaunch = useRef(false);

  useEffect(() => {
    async function checkZone() {
      const current = deviceTimeZone();
      const stored = await readJson(TIMEZONE_KEY);
      if (timezoneChanged(typeof stored === 'string' ? stored : null, current)) {
        await writeJson(TIMEZONE_KEY, current);
        setZoneTick((value) => value + 1);
      }
    }
    void checkZone();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void checkZone();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTaps((id) => router.push(`/subscriptions/${id}` as Href));
    if (!handledLaunch.current) {
      handledLaunch.current = true;
      void getLaunchTapSubscriptionId().then((id) => {
        if (id) router.push(`/subscriptions/${id}` as Href);
      });
    }
    return unsubscribe;
  }, [router]);

  const data = subscriptions.data;
  const enabled = prefs.data?.enabled ?? true;
  const defaultDays = prefs.data?.defaultDays ?? 3;
  const granted = permission.data === 'granted';

  useEffect(() => {
    if (!data || !prefs.data) return;
    if (!enabled) {
      void cancelAllReminders();
      return;
    }
    if (!granted) return;
    const planned = planReminders({
      active: activeForTotals(data, today),
      trials: trialsByEnd(data),
      defaultDays,
      now: new Date(),
    });
    void syncReminders(planned);
  }, [data, prefs.data, enabled, granted, defaultDays, today, zoneTick]);

  return null;
}
