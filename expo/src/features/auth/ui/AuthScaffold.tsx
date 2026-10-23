import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import type { ComponentProps, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { spacing, colors, sizes, radius, withAlpha } from '../../../shared/design/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { EntranceFade } from '../../../shared/widgets/EntranceFade';
import { textStyle } from '../../../shared/design/typography';
import { Spacer } from '../../../shared/widgets/Spacer';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Auth form shell: plain theme surface, compact brand row and scrollable form.
 */
export function AuthScaffold({ children }: { children: ReactNode }) {
  useThemeRevision();
  return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text style={textStyle('label')}>SubscriptTrack</Text>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

/**
 * Flutter `authHeaderChildren`: marka, simge (giriş animasyonuyla), başlık ve alt metin.
 */
export function AuthHeader({ icon, title, subtitle }: { icon: MaterialIconName; title: string; subtitle: string }) {
  useThemeRevision();
  return (
    <>
      <EntranceFade>
        <View style={styles.icon}><MaterialIcons name={icon} size={sizes.tileIcon} color={colors.primary} /></View>
      </EntranceFade>
      <Spacer size={spacing.xl} />
      <EntranceFade>
        <Text accessibilityRole="header" style={textStyle('headline')}>{title}</Text>
      </EntranceFade>
      <Spacer size={spacing.sm} />
      <EntranceFade delay={60}>
        <Text style={textStyle('body', { color: colors.onSurfaceVariant })}>{subtitle}</Text>
      </EntranceFade>
    </>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  brandDot: { width: sizes.brandDot, height: sizes.brandDot, borderRadius: radius.pill, backgroundColor: colors.primary },
  icon: { width: spacing.huge, height: spacing.huge, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, 0.1) },
}));
