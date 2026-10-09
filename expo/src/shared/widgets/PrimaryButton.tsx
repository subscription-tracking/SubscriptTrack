import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, gaps, opacity, radius, sizes, spacing, withAlpha } from '../design/tokens';
import { buttonText } from '../design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Flutter `LoadingFilledButton.tall`: 52 px (varsayılan) ya da tema minimumu 50 px. */
  tall?: boolean;
  /** Flutter `FilledButton.icon`: etiketin solundaki 18 px ikon. */
  icon?: MaterialIconName;
}

/**
 * Flutter `LoadingFilledButton` karşılığı: FilledButton, 14 köşe, yükleme sırasında
 * 20 px beyaz gösterge ve devre dışıyken basılmaz.
 */
export function PrimaryButton({ label, onPress, loading = false, disabled = false, tall = true, icon }: PrimaryButtonProps) {
  const inactive = loading || disabled;
  const foreground = inactive ? withAlpha(colors.onBackground, opacity.disabled) : colors.onPrimary;
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
        <View style={styles.content}>
          {icon ? <MaterialIcons name={icon} size={sizes.buttonIcon} color={foreground} /> : null}
          <Text style={[buttonText, { color: foreground }, icon ? styles.labelWithIcon : null]}>{label}</Text>
        </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWithIcon: {
    marginLeft: gaps.hint,
  },
});
