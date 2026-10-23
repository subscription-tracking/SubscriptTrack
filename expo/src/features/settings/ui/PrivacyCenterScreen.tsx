import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { ListRow, SettingsPanel } from './SettingsControls';

/**
 * Gizlilik ve veri merkezi (Flutter `PrivacyCenterScreen`): "Verilerin kontrolü sende" açıklaması ve yasal
 * sayfalar, dışa aktarma ve hesap silme satırları. Hesap silme kırmızı tonla gösterilir.
 */
export function PrivacyCenterScreen() {
  useThemeRevision();
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Gizlilik ve veri merkezi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPanel style={styles.card}>
          <Text style={textStyle('bodyStrong')}>Verilerin kontrolü sende</Text>
          <Text style={textStyle('bodySmall', { marginTop: spacing.sm })}>
            Aboneliklerin ve tasarruf kayıtların hesabınla ilişkilidir. Bu bilgilere yalnızca sen erişebilirsin.
          </Text>
        </SettingsPanel>
        <View style={styles.gap} />
        <SettingsPanel style={styles.rows}>
        <ListRow icon="policy" label="Gizlilik politikası" onPress={() => router.push('/legal/privacy')} />
        <ListRow icon="gavel" label="Kullanım şartları" onPress={() => router.push('/legal/terms')} />
        <ListRow
          icon="download"
          label="Verilerimi dışa aktar"
          subtitle="CSV dosyası olarak paylaş"
          onPress={() => router.push('/settings/export')}
        />
        <ListRow
          icon="delete-forever"
          label="Hesabımı ve verilerimi sil"
          subtitle="Bu işlem geri alınamaz"
          tone={colors.error}
          last
          onPress={() => router.push('/settings/delete-account')}
        />
        </SettingsPanel>
        <ScreenBottomInset />
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rows: {
    marginBottom: spacing.md,
  },
  gap: {
    height: spacing.xs,
  },
  bottom: {
    height: spacing.lg,
  },
}));
