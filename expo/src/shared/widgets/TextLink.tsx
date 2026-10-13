import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { Pressable, StyleSheet, Text, type TextStyle } from 'react-native';
import { colors, spacing, sizes } from '../design/tokens';

import { textButtonText } from '../design/typography';

/** Flutter `TextButton` (M3): en az 48 px dokunma alanı, primary renkli 14 px yazı. */
export function TextLink({
  label,
  onPress,
  align = 'start',
  style,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  align?: 'start' | 'center' | 'end';
  style?: TextStyle;
  /** `danger`: yıkıcı eylem (ör. kalıcı silme) hata renginde ve altı çizili. */
  tone?: 'primary' | 'danger';
}) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={[styles.touch, { alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center' }]}
    >
      <Text style={[textButtonText, tone === 'danger' && { color: colors.error, textDecorationLine: 'underline' }, style]}>{label}</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  touch: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
}));
