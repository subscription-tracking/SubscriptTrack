import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius, colors, sizes } from '../design/tokens';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


/**
 * Flutter `CheckboxListTile` (leading, contentPadding 0) karşılığı. Kutu 18 px,
 * köşe 2, işaretliyken primary dolgu ve onPrimary onay simgesi.
 */
export function CheckboxRow({ checked, onChange, children, disabled = false, accessibilityHint }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode; disabled?: boolean; accessibilityHint?: string }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} accessibilityHint={accessibilityHint} disabled={disabled} onPress={() => onChange(!checked)} style={styles.row}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <MaterialIcons name="check" size={16} color={colors.onPrimary} /> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.minTouchTarget,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
  },
}));
