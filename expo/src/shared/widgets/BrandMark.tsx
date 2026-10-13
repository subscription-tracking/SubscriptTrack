import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import { radius , colors, opacity, spacing, withAlpha } from '../design/tokens';

import { textStyle } from '../design/typography';

/** Flutter `BrandMark`: küçük nokta ve "SubscriptTrack" yazısı. */
export function BrandMark() {
  useThemeRevision();
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.label}>SubscriptTrack</Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
  },
  label: {
    marginLeft: spacing.xs,
    ...textStyle('label', { color: withAlpha(colors.onBackground, opacity.muted), letterSpacing: -0.2 }),
  },
}));
