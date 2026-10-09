import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, spacing } from '../../../../shared/design/tokens';

/** Flutter `FormSection`: 16 dolgu, 16 köşe, 0.5 dış kenarlık (outline %50). İlgili alanları gruplar. */
export function FormSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.md,
    borderRadius: radius.section,
    borderWidth: borderWidth.hairline,
    borderColor: colors.outlineHalf,
    gap: spacing.md,
  },
});
