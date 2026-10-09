import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius } from '../design/tokens';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors } from '../design/tokens';

/**
 * Flutter `CheckboxListTile` (leading, contentPadding 0) karşılığı. Kutu 18 px,
 * köşe 2, işaretliyken primary dolgu ve onPrimary onay simgesi.
 */
export function CheckboxRow({ checked, onChange, children }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={styles.row}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <MaterialIcons name="check" size={14} color={colors.onPrimary} /> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  box: {
    width: 18,
    height: 18,
    marginTop: spacing.xxs,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.onSurfaceVariant,
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
});
