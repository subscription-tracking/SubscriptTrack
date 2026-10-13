import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { SectionLabel, SettingsTile } from '../../settings/ui/SettingsParts';
import { cancelAllReminders, sendTestReminder } from '../data/notificationScheduler';
import { DEFAULT_DAYS_OPTIONS, type NotifyPrefs, useNotifyPrefs, useSetNotifyPrefs } from '../data/notificationPrefs';
import { useRequestPermission, usePermissionQuery } from '../data/notificationPermission';

const DAY_LABELS: Record<number, string> = { 1: '1 gün önce', 3: '3 gün önce', 7: '7 gün önce' };

/**
 * Bildirim ayarları (Flutter `NotificationPreferencesScreen`): yenileme bildirimleri anahtarı (izin istenir), gün
 * seçimi, hatırlatma saati ve test bildirimi. Açık değilken gün, saat ve test satırları gizlenir.
 */
export function NotificationPreferencesScreen() {
  useThemeRevision();
  const prefs = useNotifyPrefs();
  const state: AsyncState<NotifyPrefs> = prefs.isPending
    ? { status: 'loading' }
    : prefs.isError
      ? { status: 'error', message: 'Tercihler okunamadı.', onRetry: () => void prefs.refetch() }
      : { status: 'ready', data: prefs.data };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Bildirimler" />
      <AsyncStateView state={state}>{(value) => <Preferences value={value} />}</AsyncStateView>
    </View>
  );
}

function Preferences({ value }: { value: NotifyPrefs }) {
  useThemeRevision();
  const save = useSetNotifyPrefs();
  const snackbar = useSnackbar();
  const permission = usePermissionQuery();
  const requestPermission = useRequestPermission();
  const [requesting, setRequesting] = useState(false);
  const [pickingHour, setPickingHour] = useState(false);
  const unsupported = permission.data === 'unsupported';
  const denied = value.enabled && permission.data === 'denied';

  // Ayarlardan dönülünce izin durumu yenilenir; izin verilince uyarı bandı kaybolur.
  const refetchPermission = permission.refetch;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refetchPermission();
    });
    return () => subscription.remove();
  }, [refetchPermission]);

  function openSettings() {
    void Linking.openSettings().catch(() => snackbar.show('Cihaz ayarları açılamadı.', 'error'));
  }

  async function toggleEnabled(next: boolean) {
    try {
      if (next) {
        setRequesting(true);
        const status = await requestPermission();
        if (status !== 'granted') {
          snackbar.show('Bildirim izni verilmedi. Ayarlardan açabilirsin.', 'error');
          return;
        }
      }
      await save({ ...value, enabled: next });
      if (!next) await cancelAllReminders();
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Tercihler kaydedilemedi.', 'error');
    } finally { setRequesting(false); }
  }

  async function pickHour(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setPickingHour(false);
    if (event.type === 'dismissed' || !picked) return;
    try {
      await save({ ...value, reminderHour: picked.getHours() });
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Saat kaydedilemedi.', 'error');
    }
  }

  async function sendTest() {
    try {
      const sent = await sendTestReminder();
      snackbar.show(sent ? 'Test bildirimi gönderildi.' : 'Bildirim izni kapalı. Önce cihaz ayarlarından izin ver.', sent ? 'primary' : 'error');
    } catch { snackbar.show('Test bildirimi planlanamadı. İzinleri kontrol edip tekrar dene.', 'error'); }
  }

  const selectedDays = value.defaultDays;
  const hourLabel = `${String(value.reminderHour).padStart(2, '0')}:00`;

  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.switchRow}>
        <MaterialIcons name="notifications-none" size={sizes.tileIcon} color={colors.onSurface} />
        <View style={styles.switchText}>
          <Text style={textStyle('tileLabel')}>Yenileme bildirimleri</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Abonelik yenilenmeden önce bildirim al</Text>
        </View>
        <Switch
          value={value.enabled}
          disabled={requesting || unsupported}
          onValueChange={(next) => void toggleEnabled(next)}
          trackColor={{ false: colors.outline, true: withAlpha(colors.primary, 0.5) }}
          thumbColor={value.enabled ? colors.primary : colors.onSurfaceVariant}
        />
      </View>
      {denied ? (
        <View style={styles.deniedBand} accessibilityRole="alert">
          <MaterialIcons name="notifications-off" size={sizes.tileIcon} color={colors.error} />
          <Text style={[textStyle('bodySmall', { color: colors.onSurface }), styles.deniedText]}>Bildirim izni kapalı; hatırlatmalar gelmeyecek.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Ayarları aç" onPress={openSettings} style={styles.deniedAction}>
            <Text style={textStyle('tileLabel', { color: colors.primary })}>Ayarları aç</Text>
          </Pressable>
        </View>
      ) : null}
      {unsupported ? (
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
          Bu Android Expo Go oturumunda yerel bildirim modülü başlatılamıyor. Geliştirme derlemesinde kullanılabilir.
        </Text>
      ) : null}

      {value.enabled ? (
        <>
          <View style={styles.divider} />
          <SectionLabel label="Kaç gün önce hatırlatılsın?" />
          {DEFAULT_DAYS_OPTIONS.map((days) => {
            const selected = selectedDays === days;
            return (
              <Pressable
                key={days}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => void save({ ...value, defaultDays: days })}
                style={styles.radioRow}
              >
                <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.onSurfaceVariant }]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={textStyle('body', { marginLeft: gaps.rowLoose - 2 })}>{DAY_LABELS[days]}</Text>
              </Pressable>
            );
          })}
          <View style={styles.divider} />
          <SettingsTile icon="schedule" label="Hatırlatma saati" value={hourLabel} onPress={() => setPickingHour(true)} />
          <View style={styles.divider} />
          <SettingsTile icon="send" label="Test bildirimi gönder" value="Bildirimlerin çalıştığını doğrula" onPress={() => void sendTest()} />
        </>
      ) : null}

      {pickingHour ? (
        <DateTimePicker
          value={new Date(2000, 0, 1, value.reminderHour, 0)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, picked) => void pickHour(event, picked)}
        />
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: gaps.rowLoose - 2 + spacing.xxs / 2,
  },
  switchText: {
    flex: 1,
    marginLeft: gaps.rowLoose - 2,
    marginRight: spacing.xs,
  },
  deniedBand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.tile,
    backgroundColor: withAlpha(colors.error, 0.12),
  },
  deniedText: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  deniedAction: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  divider: {
    height: borderWidth.hairline,
    marginVertical: spacing.xs,
    backgroundColor: colors.border,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  radioOuter: {
    width: sizes.radioOuter,
    height: sizes.radioOuter,
    borderRadius: sizes.radioOuter / 2,
    borderWidth: borderWidth.focused + 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: sizes.radioInner,
    height: sizes.radioInner,
    borderRadius: sizes.radioInner / 2,
    backgroundColor: colors.primary,
  },
}));
