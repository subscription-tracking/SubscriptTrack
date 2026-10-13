import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { CURRENCY_OPTIONS } from '../../onboarding/domain/slides';
import { useActiveCurrency, useSetActiveCurrency, useSetUserTimeZone, useUserTimeZone, useUserTimeZoneState, useSetTimeZoneMode } from '../data/useActiveCurrency';
import { deviceTimeZone } from '../../../core/time/calendar';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { SectionLabel } from './SettingsParts';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useThemePreference } from '../../../shared/design/ThemeProvider';

const TIME_ZONES = [
  ['UTC', 'UTC'],
  ['Türkiye', 'Europe/Istanbul'],
  ['Londra', 'Europe/London'],
  ['Paris / Berlin', 'Europe/Paris'],
  ['New York', 'America/New_York'],
  ['Los Angeles', 'America/Los_Angeles'],
  ['Dubai', 'Asia/Dubai'],
  ['Moskova', 'Europe/Moscow'],
  ['Hindistan', 'Asia/Kolkata'],
  ['Singapur', 'Asia/Singapore'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Sydney', 'Australia/Sydney'],
] as const;

/**
 * Tema, para birimi ve saat dilimi (Flutter `AppearanceScreen`). Seçili tema satırında onay işareti gösterilir. Para birimi seçimi cihazda saklanır ve seçili satırda
 * onay işareti gösterilir. Saat dilimi profil üzerinde IANA bölgesi olarak saklanır.
 */
export function AppearanceScreen() {
  useThemeRevision();
  const selected = useActiveCurrency();
  const timeZone = useUserTimeZone();
  const { mode } = useUserTimeZoneState();
  const setMode = useSetTimeZoneMode();
  const setCurrency = useSetActiveCurrency();
  const setTimeZone = useSetUserTimeZone();
  const snackbar = useSnackbar();
  const theme = useThemePreference();
  const [showTimeZones, setShowTimeZones] = useState(false);

  function choose(code: ActiveCurrency) {
    if (code !== selected) setCurrency.mutate(code);
  }

  function chooseTimeZone(zone: string) {
    setTimeZone.mutate(zone, {
      onSuccess: () => setShowTimeZones(false),
      onError: (error) => snackbar.show(error.message, 'error'),
    });
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Görünüm ve bölge" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel label="Tema" />
        {theme.error ? <Text style={textStyle('bodySmall', { color: colors.error })}>{theme.error}</Text> : null}
        {(['system', 'light', 'dark'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: theme.preference === value }} style={styles.row} onPress={() => { void theme.setPreference(value).catch((error: Error) => snackbar.show(error.message, 'error')); }}>
          <Text style={textStyle('tileLabel', { flex: 1 })}>{value === 'system' ? 'Sistem teması' : value === 'light' ? 'Açık tema' : 'Koyu tema'}</Text>
          {theme.preference === value ? <MaterialIcons name="check" size={sizes.checkIcon} color={colors.primary} /> : null}
        </Pressable>)}
        <SectionLabel label="Para birimi" />
        {CURRENCY_OPTIONS.map((option) => {
          const active = option.code === selected;
          return (
            <Pressable
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => choose(option.code)}
              style={styles.row}
            >
              <Text style={textStyle('tileLabel', { flex: 1 })}>{`${option.name} (${option.code})`}</Text>
              {active ? <MaterialIcons name="check" size={sizes.checkIcon} color={colors.primary} /> : null}
            </Pressable>
          );
        })}

        <SectionLabel label="Saat dilimi" />
        {(['device', 'fixed'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: mode === value }} disabled={setMode.isPending} style={styles.row} onPress={() => setMode.mutate(value, { onError: (error: Error) => snackbar.show(error.message, 'error') })}>
          <Text style={textStyle('tileLabel')}>{value === 'device' ? 'Cihazı izle' : 'Sabit hesap bölgesi'}</Text>
        </Pressable>)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Saat dilimi seç, mevcut ${timeZone}`}
          onPress={() => setShowTimeZones((visible) => !visible)}
          style={styles.row}
        >
          <MaterialIcons name="schedule" size={sizes.tileIcon} color={colors.onSurface} />
          <View style={styles.timezoneText}>
            <Text style={textStyle('tileLabel')}>Saat dilimi</Text>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>
              {`Hesap saat dilimi: ${timeZone}`}
            </Text>
          </View>
          <MaterialIcons name={showTimeZones ? 'expand-less' : 'expand-more'} size={sizes.tileIcon} color={colors.onSurfaceVariant} />
        </Pressable>
        {showTimeZones ? (
          <View>
            <Pressable accessibilityRole="radio" accessibilityState={{ selected: timeZone === deviceTimeZone() }} disabled={setTimeZone.isPending} onPress={() => chooseTimeZone(deviceTimeZone())} style={styles.row}>
              <Text style={textStyle('tileLabel', { flex: 1 })}>{`Cihazın şu anki bölgesi (${deviceTimeZone()})`}</Text>
              {timeZone === deviceTimeZone() ? <MaterialIcons name="check" size={sizes.checkIcon} color={colors.primary} /> : null}
            </Pressable>
            {TIME_ZONES.map(([label, zone]) => (
              <Pressable key={zone} accessibilityRole="radio" accessibilityState={{ selected: timeZone === zone }} disabled={setTimeZone.isPending} onPress={() => chooseTimeZone(zone)} style={styles.row}>
                <Text style={textStyle('tileLabel', { flex: 1 })}>{`${label} (${zone})`}</Text>
                {timeZone === zone ? <MaterialIcons name="check" size={sizes.checkIcon} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        <ScreenBottomInset />
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: gaps.rowLoose - 2 + spacing.xxs / 2,
    gap: spacing.md,
  },
  timezoneText: {
    flex: 1,
  },
  bottom: {
    height: spacing.lg,
  },
}));
