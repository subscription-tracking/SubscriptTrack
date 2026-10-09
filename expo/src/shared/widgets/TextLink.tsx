import { Pressable, StyleSheet, Text, type TextStyle } from 'react-native';
import { spacing } from '../design/tokens';

import { sizes } from '../design/tokens';
import { textButtonText } from '../design/typography';

/** Flutter `TextButton` (M3): en az 48 px dokunma alanı, primary renkli 14 px yazı. */
export function TextLink({
  label,
  onPress,
  align = 'start',
  style,
}: {
  label: string;
  onPress: () => void;
  align?: 'start' | 'center' | 'end';
  style?: TextStyle;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={[styles.touch, { alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center' }]}
    >
      <Text style={[textButtonText, style]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
