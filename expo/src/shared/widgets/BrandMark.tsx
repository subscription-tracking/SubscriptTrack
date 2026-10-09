import { StyleSheet, Text, View } from 'react-native';
import { radius } from '../design/tokens';

import { colors, opacity, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';

/** Flutter `BrandMark`: küçük nokta ve "SubscriptTrack" yazısı. */
export function BrandMark() {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.label}>SubscriptTrack</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: withAlpha(colors.onBackground, opacity.muted),
    ...textStyle('label'),
    letterSpacing: -0.2,
  },
});
