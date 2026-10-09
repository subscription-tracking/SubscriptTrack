import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { borderWidth, colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';

/** Flutter `CurrencySelector`: yatay para birimi çipleri; seçili çip primary dolgulu ve primary kenarlıklı. */
export function CurrencySelector({ currencies, selected, onChange }: { currencies: readonly string[]; selected: string; onChange: (currency: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {currencies.map((currency) => {
        const active = currency === selected;
        return (
          <Pressable
            key={currency}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(currency)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? withAlpha(colors.primary, 0.2) : colors.surfaceHigh,
                borderColor: active ? colors.primary : withAlpha(colors.outline, 0.5),
              },
            ]}
          >
            <Text style={textStyle(active ? 'chipStrong' : 'chip', { color: active ? colors.primary : colors.onSurface })}>{currency}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.choice,
    borderWidth: borderWidth.statsEdge,
  },
});
