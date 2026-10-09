import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, radius, sizes, spacing } from '../design/tokens';
import { fontFamily } from '../design/typography';

/**
 * Flutter arama alanı (`TextField` + `InputDecoration` hintText, prefix search, suffix clear):
 * surfaceHigh dolgu, 14 köşe, 0.5 kenarlık; odakta 1.5 primary kenarlık.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && styles.focused]}>
      <MaterialIcons name="search" size={sizes.searchIcon} color={colors.onSurfaceVariant} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Temizle" onPress={() => onChangeText('')} style={styles.clear}>
          <MaterialIcons name="clear" size={sizes.clearIcon} color={colors.onSurface} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.searchHeight,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    borderRadius: radius.small,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  focused: {
    borderColor: colors.primary,
    borderWidth: borderWidth.focused,
  },
  input: {
    flex: 1,
    fontFamily,
    fontSize: 16,
    color: colors.onSurface,
    marginLeft: spacing.sm,
    paddingVertical: spacing.none,
  },
  clear: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

