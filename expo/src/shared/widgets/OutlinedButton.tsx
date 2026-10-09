import { Pressable, StyleSheet, Text } from 'react-native';
import { spacing } from '../design/tokens';

import { borderWidth, colors, radius, sizes } from '../design/tokens';
import { buttonText } from '../design/typography';

/** Flutter `OutlinedButton` (tema): 0.5 kenarlık, 14 köşe, onSurface yazı, 52 px yükseklik. */
export function OutlinedButton({ label, onPress, minHeight = sizes.tallButtonHeight }: { label: string; onPress: () => void; minHeight?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { minHeight }, pressed && styles.pressed]}
    >
      <Text style={[buttonText, styles.label]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.small,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.onSurface,
  },
});
