import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';

/** Flutter `StatsCardSurface`: 24 köşe, outlineVariant %60 ince kenarlık, yüzey zemini. */
export function StatsCardSurface({ children, padding = spacing.lg + spacing.xxs / 2 }: { children: ReactNode; padding?: number }) {
  return <View style={[styles.surface, { padding }]}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    width: '100%',
    borderRadius: radius.statsCard,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.border, 0.6),
    backgroundColor: colors.surface,
  },
});
