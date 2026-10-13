import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { useUserTimeZoneState } from '../../settings/data/useActiveCurrency';
import { trialsByEnd } from '../../dashboard/domain/dashboardSummary';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { cancelAllReminders, configureNotifications, getLaunchTapSubscriptionId, subscribeToTaps, syncReminders } from '../data/notificationScheduler';
import { notifyPrefsKey, useNotifyPrefs } from '../data/notificationPrefs';
import { permissionKey, usePermissionQuery } from '../data/notificationPermission';
import { isCatchUpIdentifier, planReminders, timezoneChanged } from '../domain/reminderPlanner';
import { readJson, writeJson } from '../../../core/storage/secureJsonStore';
import { markSentMarkers, readSentMarkers } from '../data/notificationLocalState';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';

const TIMEZONE_KEY = 'notifications.timezone';

/**
 * Oturum açıkken yerel hatırlatmaları abonelik verisiyle eşitler ve bildirime dokunmayı
 * abonelik detayına yönlendirir. Görsel öğesi yoktur.
 */
export function NotificationSync() {
  const router = useRouter();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const prefs = useNotifyPrefs();
  const permission = usePermissionQuery();
  const { timeZone, ready: timeZoneReady } = useUserTimeZoneState();
  // Uygulama öne her geldiğinde saat dilimi kontrol edilir; değiştiyse plan ve bugün yeniden hesaplanır.
  const [zoneTick, setZoneTick] = useState(0);
  // App resume also recomputes today when midnight passed while the app was suspended.
  const today = useCivilToday(timeZone);
  const handledLaunch = useRef(false);
  const accountId = user?.id;
  useEffect(() => {
    handledLaunch.current = false;
    return () => { void cancelAllReminders().catch(() => snackbar.show('Önceki hesabın hatırlatmaları temizlenemedi. Uygulamayı yeniden açmayı dene.', 'error')); };
  }, [accountId, snackbar]);

  useEffect(() => {
    async function checkZone() {
      const current = timeZone;
      const stored = await readJson(TIMEZONE_KEY);
      if (timezoneChanged(typeof stored === 'string' ? stored : null, current)) {
        await writeJson(TIMEZONE_KEY, current);
        setZoneTick((value) => value + 1);
      }
    }
    const check = () => { void checkZone().catch(() => snackbar.show('Saat dilimi tercihi okunamadı. Uygulamayı yeniden açmayı dene.', 'error')); };
    check();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void queryClient.invalidateQueries({ queryKey: permissionKey });
        setZoneTick((value) => value + 1);
        if (user) {
          void queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          void queryClient.invalidateQueries({ queryKey: notifyPrefsKey(user.id) });
        }
        check();
      }
    });
    return () => subscription.remove();
  }, [queryClient, timeZone, user, snackbar]);

  useEffect(() => {
    void configureNotifications().catch(() => snackbar.show('Bildirim kanalı hazırlanamadı. Tekrar denenecek.', 'error'));
  }, [snackbar]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTaps((id) => { if (user) router.push(`/subscriptions/${id}` as Href); }, () => snackbar.show('Bildirim ertelenemedi. Bildirim izinlerini kontrol edip tekrar dene.', 'error'));
    if (user && !handledLaunch.current) {
      handledLaunch.current = true;
      void getLaunchTapSubscriptionId().then((id) => {
        if (id) router.push(`/subscriptions/${id}` as Href);
      }).catch(() => { handledLaunch.current = false; snackbar.show('Açılış bildirimi okunamadı.', 'error'); });
    }
    return unsubscribe;
  }, [router, user, snackbar]);

  const data = subscriptions.data;
  const enabled = prefs.data?.enabled ?? true;
  const defaultDays = prefs.data?.defaultDays ?? 3;
  const reminderHour = prefs.data?.reminderHour ?? 9;
  const granted = permission.data === 'granted';

  useEffect(() => {
    if (!timeZoneReady || !data || !prefs.data) return;
    if (!enabled) {
      void cancelAllReminders().catch(() => snackbar.show('Bildirimler kaldırılamadı. Tekrar dene.', 'error'));
      return;
    }
    if (!granted) return;
    let active = true;
    // Yedek bildirim işaretleri okunur, plan kurulur, yedekler cihaza planlanınca işaretlenir.
    const run = async () => {
      const sentMarkers = accountId ? await readSentMarkers(accountId) : undefined;
      if (!active) return;
      const planned = planReminders({
        hour: reminderHour,
        active: data.filter((item) => item.status === 'active'),
        trials: trialsByEnd(data),
        defaultDays,
        now: new Date(),
        timeZone,
        sentMarkers,
      });
      await configureNotifications();
      if (!active) return;
      await syncReminders(planned, data.map((item) => item.id));
      const catchUps = planned.map((item) => item.identifier).filter(isCatchUpIdentifier);
      if (accountId && catchUps.length) await markSentMarkers(accountId, catchUps);
    };
    void run().catch(() => { if (active) snackbar.show('Hatırlatmalar planlanamadı. Bildirim ve alarm izinlerini kontrol et.', 'error'); });
    return () => { active = false; };
  }, [data, prefs.data, enabled, granted, defaultDays, reminderHour, today, timeZone, timeZoneReady, zoneTick, snackbar, accountId]);

  return null;
}
