import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { cancelAllReminders } from '../data/notificationScheduler';
import { DEFAULT_DAYS_OPTIONS, type NotifyPrefs, useNotifyPrefs, useSetNotifyPrefs } from '../data/notificationPrefs';
import { useRequestPermission, usePermissionQuery } from '../data/notificationPermission';

const DAY_LABELS: Record<number, string> = { 0: 'Aynı gün', 1: '1 gün önce', 3: '3 gün önce', 7: '7 gün önce' };
const DAY_OPTIONS: ChoiceOption<string>[] = DEFAULT_DAYS_OPTIONS.map((days) => ({ value: String(days), label: DAY_LABELS[days] }));

/** Bildirim tercihleri (Flutter `NotificationPreferencesScreen` karşılığı). İzin açıklaması sistem penceresinden önce gösterilir. */
export function NotificationPreferencesScreen() {
  const router = useRouter();
  const prefs = useNotifyPrefs();
  const permission = usePermissionQuery();

  const state: AsyncState<NotifyPrefs> = prefs.isPending
    ? { status: 'loading' }
    : prefs.isError
      ? { status: 'error', message: 'Tercihler okunamadı.', onRetry: () => void prefs.refetch() }
      : { status: 'ready', data: prefs.data };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Bildirim tercihleri</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(value) => (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <PermissionCard status={permission.data ?? 'undetermined'} />
            <Spacer size={spacing.md} />
            <Preferences value={value} />
            <Spacer size={sizes.bottomNavHeight} />
          </ScrollView>
        )}
      </AsyncStateView>
    </View>
  );
}

function PermissionCard({ status }: { status: 'granted' | 'denied' | 'undetermined' }) {
  const request = useRequestPermission();
  const snackbar = useSnackbar();

  if (status === 'granted') {
    return (
      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Bildirimler açık</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Hatırlatmalar yalnızca bu cihazda zamanlanır; sunucuya gönderilmez.
        </Text>
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Bildirimler kapalı</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Hatırlatmaları almak için bildirimleri cihaz ayarlarından aç.
        </Text>
        <OutlinedButton label="Ayarları aç" onPress={() => void Linking.openSettings()} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={textStyle('titleSmall')}>Hatırlatmalar için izin</Text>
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
        Abonelik yenilemelerini ve deneme bitişlerini zamanında hatırlatmak için bildirim izni gerekir. Hatırlatmalar yalnızca bu cihazda zamanlanır.
      </Text>
      <PrimaryButton
        label="İzin ver"
        onPress={() => {
          void request().catch(() => snackbar.show('İzin isteği başarısız oldu.', 'error'));
        }}
      />
    </View>
  );
}

function Preferences({ value }: { value: NotifyPrefs }) {
  const save = useSetNotifyPrefs();
  const snackbar = useSnackbar();

  async function update(next: NotifyPrefs) {
    try {
      await save(next);
      if (!next.enabled) await cancelAllReminders();
    } catch {
      snackbar.show('Tercih kaydedilemedi.', 'error');
    }
  }

  return (
    <View style={styles.card}>
      <CheckboxRow checked={value.enabled} onChange={(enabled) => void update({ ...value, enabled })}>
        <Text style={textStyle('bodySmall')}>Yenileme ve deneme hatırlatmaları</Text>
      </CheckboxRow>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>Kayıtta kural yoksa varsayılan</Text>
      <ChoiceChips
        options={DAY_OPTIONS}
        value={String(value.defaultDays)}
        onChange={(days) => void update({ ...value, defaultDays: Number(days) })}
      />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Hatırlatmalar yerel saatle 09:00'da gelir. Deneme bitişlerinden 7, 3 ve 1 gün önce hatırlatılır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.sm,
  },
});
