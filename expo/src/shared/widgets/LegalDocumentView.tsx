import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, screenGutter, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';
import { type LegalDocument } from '../../features/legal/domain/legalDocuments';
import { Spacer } from './Spacer';

/** Yasal metin görünümü: başlık, sürüm, kısa özet ve bölümler. Taslak uyarısı her zaman görünür. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={textStyle('title')}>{document.title}</Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Sürüm {document.version} · Son güncelleme {document.lastUpdated}
      </Text>
      <Spacer size={spacing.md} />

      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Özet</Text>
        {document.summary.map((line) => (
          <Text key={line} style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            • {line}
          </Text>
        ))}
      </View>

      {document.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={textStyle('titleSmall')}>{section.title}</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{section.body}</Text>
        </View>
      ))}

      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Bu metin taslaktır; yayın öncesi hukuki onay gerektirir.
      </Text>
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
});
