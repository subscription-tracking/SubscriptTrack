import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { CURRENCY_OPTIONS } from '../../onboarding/domain/slides';
import { useActiveCurrency, useSetActiveCurrency } from '../data/useActiveCurrency';
import { deviceTimeZone } from '../../../core/time/calendar';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { SectionLabel } from './SettingsParts';

/**
 * Para birimi ve saat dilimi (Flutter `AppearanceScreen`). Para birimi seçimi cihazda saklanır ve seçili satırda
 * onay işareti gösterilir. Saat dilimi bu sürümde cihaz saat dilimini kullanır; Flutter'daki elle seçim henüz yok.
 */
export function AppearanceScreen() {
  const selected = useActiveCurrency();
  const setCurrency = useSetActiveCurrency();

  function choose(code: ActiveCurrency) {
    if (code !== selected) setCurrency.mutate(code);
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Para birimi ve saat dilimi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <View style={styles.row}>
          <MaterialIcons name="schedule" size={sizes.tileIcon} color={colors.onSurface} />
          <View style={styles.timezoneText}>
            <Text style={textStyle('tileLabel')}>Saat dilimi</Text>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>
              {`Cihaz saat dilimi: ${deviceTimeZone()}`}
            </Text>
          </View>
        </View>
        <ScreenBottomInset />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
