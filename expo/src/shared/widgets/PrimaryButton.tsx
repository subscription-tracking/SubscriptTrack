import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { spacing } from '../design/tokens';

import { colors, opacity, radius, sizes, withAlpha } from '../design/tokens';
import { buttonText } from '../design/typography';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Flutter `LoadingFilledButton.tall`: 52 px (varsayılan) ya da tema minimumu 50 px. */
  tall?: boolean;
}

/**
 * Flutter `LoadingFilledButton` karşılığı: FilledButton, 14 köşe, yükleme sırasında
 * 20 px beyaz gösterge ve devre dışıyken basılmaz.
 */
export function PrimaryButton({ label, onPress, loading = false, disabled = false, tall = true }: PrimaryButtonProps) {
  const inactive = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: tall ? sizes.tallButtonHeight : sizes.primaryButtonHeight },
        inactive && styles.buttonInactive,
        pressed && !inactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={[buttonText, styles.label, inactive && styles.labelInactive]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.small,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonInactive: {
    backgroundColor: withAlpha(colors.onBackground, opacity.disabledContainer),
  },
  buttonPressed: {
    opacity: 0.88,
  },
  labelInactive: {
    color: withAlpha(colors.onBackground, opacity.disabled),
  },
  label: {
    color: colors.onPrimary,
  },
});
