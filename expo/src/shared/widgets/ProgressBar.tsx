import { StyleSheet, View } from 'react-native';

import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { colors, radius, spacing } from '../design/tokens';

const BAR_HEIGHT = 8;

/** İnce ilerleme çubuğu. `fraction` 0–1 arası; erişilebilirlikte yüzde olarak okunur. */
export function ProgressBar({ fraction, accessibilityLabel }: { fraction: number; accessibilityLabel: string }) {
  useThemeRevision();
  const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const percent = Math.round(clamped * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

export interface StackedBarSegment {
  key: string;
  /** Göreli ağırlık (örn. tutar ya da yüzde). */
  weight: number;
  color: string;
}

/** Yığılmış yatay çubuk (kategori dağılımı). Boş ya da sıfır ağırlıklı dilimler çizilmez. */
export function StackedBar({ segments, accessibilityLabel }: { segments: readonly StackedBarSegment[]; accessibilityLabel: string }) {
  useThemeRevision();
  const visible = segments.filter((segment) => segment.weight > 0);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.stack}>
      {visible.map((segment) => (
        <View key={segment.key} style={[styles.segment, { flex: segment.weight, backgroundColor: segment.color }]} />
      ))}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  track: { height: BAR_HEIGHT, borderRadius: radius.xs, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: BAR_HEIGHT, backgroundColor: colors.primary },
  stack: { height: BAR_HEIGHT + 2, flexDirection: 'row', borderRadius: radius.xs, overflow: 'hidden', gap: spacing.xxs / 2 },
  segment: { height: BAR_HEIGHT + 2 },
}));
