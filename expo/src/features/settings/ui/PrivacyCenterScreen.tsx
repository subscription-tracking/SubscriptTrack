import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { ListRow } from './SettingsControls';

/**
 * Gizlilik ve veri merkezi (Flutter `PrivacyCenterScreen`): "Verilerin kontrolü sende" açıklaması ve yasal
 * sayfalar, dışa aktarma ve hesap silme satırları. Hesap silme kırmızı tonla gösterilir.
 */
export function PrivacyCenterScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Gizlilik ve veri merkezi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={textStyle('cardTitle')}>Verilerin kontrolü sende</Text>
          <Text style={textStyle('bodySmall', { marginTop: spacing.sm })}>
            Aboneliklerin ve tasarruf kayıtların hesabınla ilişkilidir. Bu bilgilere yalnızca sen erişebilirsin.
          </Text>
        </View>
        <View style={styles.gap} />
        <ListRow icon="policy" label="Gizlilik Politikası" onPress={() => router.push('/legal/privacy')} />
        <ListRow icon="gavel" label="Kullanım Şartları" onPress={() => router.push('/legal/terms')} />
        <ListRow
          icon="download"
          label="Verilerimi dışa aktar"
          subtitle="CSV olarak paylaş veya panoya kopyala"
          onPress={() => router.push('/settings/export')}
        />
        <ListRow
          icon="delete-forever"
          label="Hesabımı ve verilerimi sil"
          subtitle="Bu işlem geri alınamaz"
          tone={colors.error}
          onPress={() => router.push('/settings/delete-account')}
        />
        <View style={styles.bottom} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: sizes.bottomNavHeight,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
  gap: {
    height: spacing.xs,
  },
  bottom: {
    height: spacing.lg,
  },
});
