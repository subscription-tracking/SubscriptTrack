import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Shared settings surface matching the grouped cards on Settings Home. */
export function SettingsPanel({ children, style }: { children: ReactNode; style?: object }) {
  useThemeRevision();
  return <View style={[styles.panel, style]}>{children}</View>;
}

/** Flutter `SwitchListTile`: başlık, alt satır ve sağda anahtar. */
export function SwitchTile({
  label,
  subtitle,
  value,
  disabled = false,
  icon,
  onValueChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  icon?: MaterialIconName;
  onValueChange: (next: boolean) => void;
}) {
  useThemeRevision();
  return (
    <View style={styles.row}>
      {icon ? <MaterialIcons name={icon} size={sizes.tileIcon} color={colors.onSurface} /> : null}
      <View style={[styles.texts, icon ? styles.textsWithIcon : null]}>
        <Text style={textStyle('label')}>{label}</Text>
        {subtitle ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.outline, true: withAlpha(colors.primary, 0.5) }}
        thumbColor={value ? colors.primary : colors.onSurfaceVariant}
      />
    </View>
  );
}

/** Flutter `RadioListTile`: solda radyo, sağda etiket. Seçili olan dolu noktayla gösterilir. */
export function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.radio}>
      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.onSurfaceVariant }]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={textStyle('body', { marginLeft: gaps.rowLoose - 2 })}>{label}</Text>
    </Pressable>
  );
}

/** Flutter `ListTile` (alt satırlı): ikon, başlık, alt satır ve chevron. Tehlikeli satırlarda renk verilir. */
export function ListRow({
  icon,
  label,
  subtitle,
  tone,
  last = false,
  onPress,
}: {
  icon: MaterialIconName;
  label: string;
  subtitle?: string;
  tone?: string;
  last?: boolean;
  onPress: () => void;
}) {
  useThemeRevision();
  const color = tone ?? colors.onSurface;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, last ? styles.rowLast : null, pressed ? styles.pressed : null]}>
      <MaterialIcons name={icon} size={sizes.tileIcon} color={color} />
      <View style={[styles.texts, styles.textsWithIcon]}>
        <Text style={textStyle('label', { color })}>{label}</Text>
        {subtitle ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={sizes.tileIcon} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  panel: {
    overflow: 'hidden',
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: gaps.rowLoose - 2 + spacing.xxs / 2,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  texts: {
    flex: 1,
    marginRight: spacing.xs,
  },
  textsWithIcon: {
    marginLeft: gaps.rowLoose - 2,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  radioOuter: {
    width: sizes.radioOuter,
    height: sizes.radioOuter,
    borderRadius: sizes.radioOuter / 2,
    borderWidth: borderWidth.focused + 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: sizes.radioInner,
    height: sizes.radioInner,
    borderRadius: sizes.radioInner / 2,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
}));
