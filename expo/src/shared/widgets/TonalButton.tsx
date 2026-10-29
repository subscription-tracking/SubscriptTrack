import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { Pressable, StyleSheet, Text } from 'react-native';

import { borderWidth, colors, radius, sizes, spacing } from '../design/tokens';
import { buttonText } from '../design/typography';

interface TonalButtonProps {
  label: string;
  onPress: () => void;
  /** `danger`: yıkıcı eylem; kenarlık ve yazı hata renginde. */
  tone?: 'neutral' | 'danger';
  disabled?: boolean;
  minHeight?: number;
}

/**
 * İkincil düğme: yüzey dolgusu ve kontrastlı (≥3:1) bileşen sınırı. Birincil eylem `PrimaryButton`,
 * üçüncül eylem `TextLink`. En az 48 px dokunma alanı; pasif durum yalnızca opaklıkla değil,
 * `disabledSurface`/`disabledText` ile gösterilir.
 */
export function TonalButton({ label, onPress, tone = 'neutral', disabled = false, minHeight = sizes.minTouchTarget }: TonalButtonProps) {
  useThemeRevision();
  const danger = tone === 'danger';
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: Math.max(minHeight, sizes.minTouchTarget) },
        danger && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[buttonText, { color: disabled ? colors.disabledText : danger ? colors.error : colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  button: {
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: {
    borderColor: colors.error,
  },
  disabled: {
    borderColor: colors.disabledSurface,
    backgroundColor: colors.disabledSurface,
  },
  pressed: {
    opacity: 0.7,
  },
}));
