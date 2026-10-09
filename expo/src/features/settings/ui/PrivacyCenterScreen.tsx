import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';

/**
 * Gizlilik merkezi: verinin nerede tutulduğunu anlatır, yasal sayfalara ve uygulama kilidine bağlar.
 * Veri dışa aktarma ve hesap silme bu ekrana Aşama 6 / S8'de eklenecek.
 */
export function PrivacyCenterScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Gizlilik merkezi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={textStyle('titleSmall')}>Verilerin</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            Abonelik kayıtların ve ödemelerin hesabına bağlı olarak sunucuda saklanır ve yalnızca sen erişebilirsin. Bildirimler cihazında zamanlanır; uzak bildirim gönderimi yoktur.
          </Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            Oturum bilgilerin ve uygulama kilidi PIN özetin cihazın güvenli deposunda tutulur.
          </Text>
        </View>

        <Spacer size={spacing.md} />
        <View style={styles.card}>
          <Text style={textStyle('titleSmall')}>Bağlantılar</Text>
          <OutlinedButton label="Uygulama kilidi" onPress={() => router.push('/settings/app-lock' as Href)} />
          <OutlinedButton label="Verileri dışa aktar" onPress={() => router.push('/settings/export' as Href)} />
          <OutlinedButton label="Gizlilik politikası" onPress={() => router.push('/legal/privacy' as Href)} />
          <OutlinedButton label="Kullanım koşulları" onPress={() => router.push('/legal/terms' as Href)} />
        </View>

        <Spacer size={spacing.md} />
        <View style={styles.card}>
          <Text style={textStyle('titleSmall', { color: colors.error })}>Hesap</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Hesabını ve tüm verilerini kalıcı olarak silebilirsin.</Text>
          <OutlinedButton label="Hesabı sil" onPress={() => router.push('/settings/delete-account' as Href)} />
        </View>
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
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
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.sm,
  },
});
