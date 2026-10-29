import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { borderWidth, colors, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';

/** Form alanlarını başlık ve ayırıcıyla gruplar. */
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
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
}));
