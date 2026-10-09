import { type ReactNode, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../src/features/auth/AuthProvider';
import { messageForError } from '../../../src/features/auth/domain/authErrors';
import { colors, radius, screenGutter, sizes, spacing } from '../../../src/shared/design/tokens';
import { textStyle } from '../../../src/shared/design/typography';
import { PrimaryButton } from '../../../src/shared/widgets/PrimaryButton';
import { Spacer } from '../../../src/shared/widgets/Spacer';

/** Ayarlar ana ekranı: hesap, tercihler, gizlilik ve yasal sayfalar. Bilgi mimarisi USER_FLOWS §15. */
export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(messageForError(err));
    } finally {
      setSigningOut(false);
    }
  }

  const go = (path: string) => () => router.push(path as Href);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={textStyle('headline')}>Ayarlar</Text>
      <Spacer size={spacing.md} />

      <Section title="Hesap">
        <Row label="Profil" description={user?.email ?? ''} onPress={go('/settings/profile')} />
      </Section>

      <Section title="Tercihler">
        <Row label="Bildirim tercihleri" onPress={go('/settings/notifications')} />
        <Row label="Görünüm" onPress={go('/settings/appearance')} />
        <Row label="Ödeme yöntemleri" onPress={go('/settings/payment-methods')} />
        <Row label="Uygulama kilidi" onPress={go('/settings/app-lock')} />
      </Section>

      <Section title="Destek">
        <Row label="Geri bildirim" onPress={go('/settings/feedback')} />
      </Section>

      <Section title="Gizlilik">
        <Row label="Gizlilik merkezi" onPress={go('/settings/privacy')} />
      </Section>

      <Section title="Yasal">
        <Row label="Gizlilik politikası" onPress={go('/legal/privacy')} />
        <Row label="Kullanım koşulları" onPress={go('/legal/terms')} />
      </Section>

      {error ? <Text style={textStyle('bodySmall', { color: colors.error })}>{error}</Text> : null}
      <Spacer size={spacing.md} />
      <PrimaryButton label="Çıkış yap" onPress={() => void handleSignOut()} loading={signingOut} />
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, description, onPress }: { label: string; description?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Text style={textStyle('titleSmall')}>{label}</Text>
        {description ? <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{description}</Text> : null}
      </View>
      <Text style={textStyle('titleSmall', { color: colors.onSurfaceVariant })}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  card: {
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
