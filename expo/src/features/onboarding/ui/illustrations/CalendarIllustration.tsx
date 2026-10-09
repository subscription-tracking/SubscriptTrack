import { Animated, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { onboardingColors } from '../../../../shared/design/palette';
import { usePulse } from '../OnboardingMotion';

/** Yenileme günü: 21 hücrelik ızgarada 17. hücre (indeks 16). */
const DUE_INDEX = 16;
const CELLS = 21;
const COLUMNS = 7;

/** Flutter `CalendarIllustration`: takvim kartı ve nabız atan "yenileme" rozeti. 220 × 200 kutu. */
export function CalendarIllustration() {
  const pulse = usePulse();
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  return (
    <View style={styles.box}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerBar} />
          <MaterialIcons name="chevron-right" size={16} color={withAlpha(colors.onSurface, 0.3)} />
        </View>
        <View style={styles.grid}>
          {Array.from({ length: CELLS }, (_, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                { backgroundColor: index === DUE_INDEX ? onboardingColors.green : withAlpha(colors.onSurface, 0.06) },
              ]}
            />
          ))}
        </View>
      </View>
      <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
        <MaterialIcons name="notifications" size={15} color={colors.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 220,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 190,
    height: 178,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + spacing.xxs / 2,
    paddingBottom: spacing.md,
    borderRadius: radius.large,
    borderWidth: borderWidth.regular,
    borderColor: withAlpha(onboardingColors.green, 0.22),
    backgroundColor: colors.surfaceHigh,
    shadowColor: onboardingColors.green,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBar: {
    width: 40,
    height: 8,
    borderRadius: spacing.xxs,
    backgroundColor: withAlpha(colors.onSurface, 0.18),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xxs + 1,
  },
  cell: {
    width: `${100 / COLUMNS - 1}%`,
    aspectRatio: 1,
    borderRadius: spacing.xxs + 1,
  },
  badge: {
    position: 'absolute',
    right: 22,
    bottom: 34,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingColors.green,
    borderWidth: spacing.xxs - 1,
    borderColor: colors.surface,
    shadowColor: onboardingColors.green,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});

