import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import type { ComponentProps, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { spacing , colors, extraSpacing as authSpacing } from '../../../shared/design/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AmbientBackground } from '../../../shared/widgets/AmbientBackground';
import { BrandMark } from '../../../shared/widgets/BrandMark';
import { EntranceFade } from '../../../shared/widgets/EntranceFade';
import { GlowOrb } from '../../../shared/widgets/GlowOrb';
import { textStyle } from '../../../shared/design/typography';
import { Spacer } from '../../../shared/widgets/Spacer';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Flutter `AuthPageScaffold` karşılığı: ambient arka plan, güvenli alan, yatay ve
 * dikey 24 px kaydırılabilir form. Giriş, kayıt ve yeni şifre ekranları bunu kullanır.
 */
export function AuthScaffold({ children }: { children: ReactNode }) {
  useThemeRevision();
  return (
    <AmbientBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AmbientBackground>
  );
}

/**
 * Flutter `authHeaderChildren`: marka, simge (giriş animasyonuyla), başlık ve alt metin.
 */
export function AuthHeader({ icon, title, subtitle }: { icon: MaterialIconName; title: string; subtitle: string }) {
  useThemeRevision();
  return (
    <>
      <BrandMark />
      <Spacer size={authSpacing.brandToOrb} />
      <EntranceFade>
        <GlowOrb icon={icon} color={colors.primary} />
      </EntranceFade>
      <Spacer size={spacing.xl} />
      <EntranceFade>
        <Text style={textStyle('headline')}>{title}</Text>
      </EntranceFade>
      <Spacer size={authSpacing.titleToSubtitle} />
      <EntranceFade delay={60}>
        <Text style={textStyle('body', { color: colors.onSurfaceVariant })}>{subtitle}</Text>
      </EntranceFade>
    </>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    // Flutter AuthPageScaffold: yatay ve dikey 24 (uygulama ekranlarındaki 20 değil).
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
}));
