import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, spacing, sizes } from '../../../shared/design/tokens';
import { textStyle, textButtonText } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { formatCurrency } from '../../../core/format/money';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import type { ParseResult } from '../domain/csvImportParser';
import { statusFallbackCounts } from '../domain/csvStatusPreview';
import { BILLING_CYCLE_LABELS, STATUS_LABELS, type SubscriptionStatus } from '../domain/subscription';
import { styles } from './csvImportStyles';

export function CsvImportPreview({ parsed, busy, online, onPick, onImport }: { parsed: ParseResult; busy: boolean; online: boolean; onPick: () => Promise<void>; onImport: () => Promise<void> }) {
  useThemeRevision();
  return (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <Text style={textStyle('bodyStrong')}>{`${parsed.rows.length} geçerli kayıt`}</Text>
            {Object.entries(statusFallbackCounts(parsed.rows)).map(([status, count]) => (
              <View key={status} style={styles.statusWarning}>
                <MaterialIcons name="warning-amber" size={sizes.linkIcon} color={colors.error} />
                <Text style={[textStyle('bodySmall', { color: colors.error }), styles.statusWarningText]}>
                  {`${count} kayıt CSV'deki durumunu koruyamayacak; ${STATUS_LABELS[status as SubscriptionStatus]} olarak eklenecek.`}
                </Text>
              </View>
            ))}
            {parsed.errors.length > 0 ? (
              <View style={styles.errors}>
                <Text accessibilityRole="header" style={textStyle('bodySmall', { color: colors.error })}>{`${parsed.errors.length} hatalı satır içe aktarılmayacak`}</Text>
                {parsed.errors.map((line) => (
                  <Text key={line} style={textStyle('caption')}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.gapRows} />
            {parsed.rows.map((row, index) => (
              <View key={`${index}-${row.name}`} style={styles.row}>
                <Text style={textStyle('body')}>{row.name}</Text>
                <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
                  {`${formatCurrency(row.amount, row.currency)} · ${BILLING_CYCLE_LABELS[row.billingCycle]} · ${STATUS_LABELS[row.status]}`}
                </Text>
              </View>
            ))}
            <View style={styles.gapRows} />
            <PrimaryButton
              label={busy ? 'İçe aktarılıyor…' : 'Geçerli kayıtları içe aktar'}
              tall={false}
              loading={busy}
              disabled={!online || busy || parsed.rows.length === 0}
              onPress={() => void onImport()}
            />
            {!online ? (
              <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xs })}>İçe aktarma için internet bağlantısı gerekir.</Text>
            ) : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void onPick()} style={styles.textButton}>
              <Text style={[textButtonText, styles.textButtonLabel]}>Başka dosya seç</Text>
            </Pressable>
            <ScreenBottomInset />
          </ScrollView>
  );
}
