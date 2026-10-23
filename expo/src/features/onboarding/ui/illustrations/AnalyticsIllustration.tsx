import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { onboardingColors } from '../../../../shared/design/palette';
import { textStyle } from '../../../../shared/design/typography';
import { useSweep } from '../OnboardingMotion';

/** Harcama dağılımı dilimleri: oran ve renk (Flutter `_segments`). */
const SEGMENTS = [
  { fraction: 0.42, color: onboardingColors.amber },
  { fraction: 0.3, color: onboardingColors.indigo },
  { fraction: 0.28, color: onboardingColors.green },
];

const RING_SIZE = 190;
const RING_INSET = 10;
const RING_STROKE = RING_SIZE * 0.09;

/**
 * Flutter `AnalyticsIllustration`: dilimli halka açılarak tamamlanır, ortada "%18 tasarruf" metni belirir.
 * Halka `progress` ile birlikte çizilir (strokeDasharray). 220 × 220 kutu.
 */
export function AnalyticsIllustration() {
  useThemeRevision();
  const { progress } = useSweep();
  const radius = RING_SIZE / 2 - RING_INSET;
  const circumference = 2 * Math.PI * radius;
  const center = RING_SIZE / 2;

  const arcs = SEGMENTS.map((segment, index) => {
    const start = SEGMENTS.slice(0, index).reduce((sum, prior) => sum + prior.fraction, 0);
    return { ...segment, length: segment.fraction * circumference * progress, offset: -start * circumference };
  });

  return (
    <View style={styles.box}>
      <View style={styles.glow} />
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
        {arcs.map((arc, index) => (
          <Circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            stroke={arc.color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={[arc.length, circumference]}
            strokeDashoffset={arc.offset}
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
      </Svg>
      <View style={[styles.center, { opacity: progress }]}>
        <MaterialIcons name="trending-down" size={sizes.centerIcon} color={onboardingColors.amber} />
        <Text style={textStyle('title', { marginTop: spacing.xxs })}>%18</Text>
        <Text style={textStyle('bodySmall', { color: withAlpha(colors.onSurface, 0.9) })}>tasarruf</Text>
      </View>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  box: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: sizes.glowCore,
    height: sizes.glowCore,
    borderRadius: sizes.glowCore / 2,
    backgroundColor: withAlpha(onboardingColors.amber, 0.12),
  },
  ring: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
