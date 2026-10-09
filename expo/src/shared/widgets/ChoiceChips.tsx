import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

/** Tek seçimli yatay çip listesi (Flutter `ChoiceChip` karşılığı). */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            hitSlop={spacing.xs}
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={textStyle('label', { color: selected ? colors.onPrimary : colors.onSurfaceVariant })}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  chip: {
    minHeight: sizes.minTouchTarget - 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
});
