import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { useNotifyPrefs } from '../../notifications/data/notificationPrefs';
import { resetOnboardingDone } from '../../onboarding/data/onboardingFlag';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { fetchPaymentMethods } from '../data/paymentMethodsRepository';
import { messageForError } from '../../auth/domain/authErrors';
import { AccountSummaryCard, SectionLabel, SettingsTile, SignOutButton } from './SettingsParts';
import { useActiveCurrency } from '../data/useActiveCurrency';
import { useThemePreference } from '../../../shared/design/ThemeProvider';

/** Uygulama sürümü (Flutter ayarlar ekranındaki sabit metin). */
const APP_VERSION = 'v1.0.0';

/** Ad yoksa e-postanın yerel kısmı; baş harfler en fazla iki harf (Flutter `_initials`). */
export function initialsFor(source: string): string {
  const base = source.split('@')[0].trim();
  const parts = base.split(/[.\s_]+/).filter((part) => part.length > 0);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (base.length === 0) return '?';
  return base.slice(0, base.length < 2 ? 1 : 2).toUpperCase();
}

/**
 * Ayarlar ana ekranı (Flutter `ProfileTab`): hesap özeti, tercihler, uygulama, veri ve gizlilik, destek ve
 * çıkış. Her satır ilgili alt ekrana gider.
 */
export function SettingsHome() {
  useThemeRevision();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const currency = useActiveCurrency();
  const theme = useThemePreference();
  const themeValue = theme.preference === 'system' ? 'Sistem' : theme.preference === 'light' ? 'Açık' : 'Koyu';
  const { user, signOut } = useAuth();
  const prefs = useNotifyPrefs();
  const methods = useQuery({
    queryKey: ['payment-methods', user?.id ?? ''],
    queryFn: fetchPaymentMethods,
    enabled: Boolean(user),
    networkMode: 'always',
  });

  if (!user) return null;

  const displayName = (user.displayName ?? '').trim();
  const hasDisplayName = displayName.length > 0;
  const name = hasDisplayName ? displayName : user.email.split('@')[0];

  async function restartOnboarding() {
    await resetOnboardingDone();
    snackbar.show('Tanıtım bir sonraki açılışta gösterilecek.', 'primary');
  }

  function confirmSignOut() {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: () => {
          signOut().catch((error: unknown) => snackbar.show(messageForError(error), 'error'));
        },
      },
    ]);
  }

  const notificationsValue = prefs.data?.enabled === false ? 'Kapalı' : 'Açık';
  const methodCount = methods.data?.length ?? 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: sizes.bottomNavHeight + insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.account}>
        <AccountSummaryCard
          initials={initialsFor(hasDisplayName ? displayName : user.email)}
          name={name}
          email={user.email}
          onPress={() => router.push('/settings/profile')}
        />
      </View>

      <SectionLabel label="Tercihler" />
      <SettingsTile icon="notifications-none" label="Bildirim ayarları" value={notificationsValue} onPress={() => router.push('/settings/notifications')} />
      <SettingsTile
        icon="label-outline"
        label="Ödeme yöntemi seçenekleri"
        value={`${methodCount} yöntem`}
        onPress={() => router.push('/settings/payment-methods')}
      />
      <SettingsTile icon="dark-mode" label="Tema" value={themeValue} onPress={() => router.push('/settings/appearance')} />
      <SettingsTile icon="tune" label="Para birimi ve saat dilimi" value={currency} onPress={() => router.push('/settings/appearance')} />

      <SectionLabel label="Uygulama" />
      <SettingsTile icon="replay" label="Tanıtımı yeniden göster" value="Tanıtım ekranlarını tekrar aç" onPress={() => void restartOnboarding()} />

      <SectionLabel label="Veri ve gizlilik" />
      <SettingsTile icon="lock-outline" label="Uygulama kilidi" value="PIN ve biyometri" onPress={() => router.push('/settings/app-lock')} />
      <SettingsTile
        icon="privacy-tip"
        label="Gizlilik ve veri merkezi"
        value="Veri ve yasal metinler"
        onPress={() => router.push('/settings/privacy')}
      />

      <SectionLabel label="Destek" />
      <SettingsTile icon="feedback" label="Geri bildirim gönder" value="Hata veya öneri" onPress={() => router.push('/settings/feedback')} />

      <View style={styles.signOutGap} />
      <SignOutButton onPress={confirmSignOut} />
      <View style={styles.versionGap} />
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>{APP_VERSION}</Text>
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  account: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  signOutGap: {
    height: gaps.sectionTop - 4,
  },
  versionGap: {
    height: gaps.cardInset,
  },
}));
