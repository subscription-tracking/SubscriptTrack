import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderWidth, colors, gaps, radius, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';
import { type LegalDocument } from '../../features/legal/domain/legalDocuments';
import { ScreenBottomInset } from './ScreenBottomInset';
import { ScreenTopBar } from './ScreenTopBar';
import { Spacer } from './Spacer';

/** Flutter `bodyMedium` (14) × 1.5 satır yüksekliği. */
const BODY_LINE_HEIGHT = 21;

/**
 * Yasal metin görünümü (Flutter `LegalDocumentScreen`): AppBar başlığı, sürüm satırı, "Kısa özet" kartı ve bölümler.
 * Metin seçilebilir kalır (Flutter `SelectionArea`). Taslak uyarısı her zaman görünür.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <View style={styles.screen}>
      <ScreenTopBar title={document.title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text selectable style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          {`Belge sürümü ${document.version} · Son güncelleme: ${document.lastUpdated}`}
        </Text>
        <Spacer size={spacing.lg} />

        <View style={styles.card}>
          <Text style={textStyle('titleSmall')}>Kısa özet</Text>
          <Spacer size={spacing.xs} />
          {document.summary.map((line) => (
            <Text key={line} selectable style={textStyle('bodySmall', { marginBottom: spacing.xxs })}>
              {`• ${line}`}
            </Text>
          ))}
        </View>

        <Spacer size={gaps.sectionTop} />

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text accessibilityRole="header" style={textStyle('titleSmall')}>
              {section.title}
            </Text>
            <Spacer size={spacing.xs} />
            <Text selectable style={textStyle('bodySmall', { lineHeight: BODY_LINE_HEIGHT })}>
              {section.body}
            </Text>
          </View>
        ))}

        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Bu metin taslaktır; yayın öncesi hukuki onay gerektirir.
        </Text>
        <ScreenBottomInset />
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
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
  section: {
    marginBottom: spacing.lg,
  },
});
