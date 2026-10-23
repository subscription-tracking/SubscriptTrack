import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { borderWidth, colors, radius, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';

/** Flutter `FormSection`: 16 dolgu, 16 köşe, 0.5 dış kenarlık (outline %50). İlgili alanları gruplar. */
export function FormSection({ children, title }: { children: ReactNode; title?: string }) {
  useThemeRevision();
  return (
    <View style={styles.section}>
      {title ? <Text accessibilityRole="header" style={textStyle('label')}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: {
    padding: spacing.md,
    borderRadius: radius.section,
    borderWidth: borderWidth.statsEdge,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    gap: spacing.md,
  },
}));
