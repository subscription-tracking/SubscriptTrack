import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { borderWidth, colors, radius, sizes } from '../design/tokens';
import { textStyle } from '../design/typography';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Tek seçimli yatay segment (2–4 seçenek): seçili dilim dolgulu, sınır `controlBorder`. Seçenekler eşit
 * genişliktedir; uzun etiket iki satıra sarılır (büyük yazıda taşmaz). `radiogroup` olarak okunur.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  useThemeRevision();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.group}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.segment, index > 0 && styles.divider, selected && styles.selected]}
          >
            <Text style={textStyle(selected ? 'label' : 'bodySmall', { color: selected ? colors.onPrimary : colors.onSurface, textAlign: 'center' })}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  group: {
    flexDirection: 'row',
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    minHeight: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { borderLeftWidth: borderWidth.hairline, borderLeftColor: colors.controlBorder },
  selected: { backgroundColor: colors.primary },
}));
