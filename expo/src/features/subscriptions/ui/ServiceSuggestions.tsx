import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type ServicePreset, matchServicePresets } from '../domain/servicePresets';

/**
 * Ad alanına yazılırken çıkan servis önerileri (Flutter form servis bölümü). Bir öneriye
 * dokunulunca ad ve kategori doldurulur. Yazı yoksa ya da tam eşleşme varsa hiçbir şey gösterilmez.
 */
export function ServiceSuggestions({
  query,
  presets,
  onPick,
}: {
  query: string;
  presets: readonly ServicePreset[];
  onPick: (preset: ServicePreset) => void;
}) {
  const matches = matchServicePresets(presets, query);
  if (matches.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {matches.map((preset) => (
        <Pressable
          key={preset.name}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel={`${preset.name} öner`}
          onPress={() => onPick(preset)}
          style={styles.pill}
        >
          <Text style={textStyle('label', { color: colors.primary })}>{preset.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  pill: {
    minHeight: sizes.minTouchTarget / 2 + spacing.xxs,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 0.5,
    borderColor: colors.primary,
  },
});
