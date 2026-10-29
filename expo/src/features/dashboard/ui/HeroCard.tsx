import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ProgressRing } from '../../../shared/widgets/ProgressRing';
import { type MonthPaymentSummary } from '../domain/homeSummary';

function fractionPaid(summary: MonthPaymentSummary): number {
  return summary.total.minorUnits === 0 ? 0 : summary.paid.minorUnits / summary.total.minorUnits;
}

/**
 * Ana sayfa kahramanı: bu ay kalan ödemeler, ödenen oran çubuğu, ödenen/toplam satırı. İlk özet ana para
 * birimidir; diğerleri küçük satırlar halinde altta yer alır. Kartın tamamı İstatistikler'i açar.
 */
export function HeroCard({
  summaries,
  fallbackCurrency,
  unavailable = false,
  loading = false,
  onPress,
  onRetry,
}: {
  summaries: readonly MonthPaymentSummary[];
  /** Hiç özet yokken sıfırın gösterileceği para birimi (aktif para birimi). */
  fallbackCurrency: string;
  unavailable?: boolean;
  loading?: boolean;
  onPress: () => void;
  onRetry: () => void;
}) {
  useThemeRevision();
  const { fontScale } = useWindowDimensions();
  if (loading) {
    return <View style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Ödeme özeti yükleniyor" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>Ödeme özeti yükleniyor</Text>
    </View>;
  }
  if (unavailable) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Ödeme özeti yüklenemedi, tekrar dene" onPress={onRetry} style={styles.card}>
        <Text style={textStyle('label')}>Ödeme özeti kullanılamıyor</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
          Ödeme geçmişi yüklenemedi. Bağlantını kontrol edip tekrar dene.
        </Text>
        <Text style={textStyle('label', { color: colors.primary, marginTop: spacing.sm })}>Tekrar dene</Text>
      </Pressable>
    );
  }
  const primary: MonthPaymentSummary = summaries[0] ?? {
    currency: fallbackCurrency,
    paid: Money.zero,
    remaining: Money.zero,
    total: Money.zero,
  };
  const others = summaries.slice(1);
  const allDone = primary.remaining.minorUnits === 0 && primary.paid.minorUnits > 0;
  const accessibilitySummary = [
    'Bu ayın özeti, istatistikleri aç',
    `kalan ${formatCurrency(primary.remaining, primary.currency)}`,
    `ödenen ${formatCurrency(primary.paid, primary.currency)}`,
    `toplam ${formatCurrency(primary.total, primary.currency)}`,
    ...(primary.total.minorUnits > 0 ? [`ödenen oran yüzde ${Math.round(fractionPaid(primary) * 100)}`] : []),
    ...others.map((item) => `${item.currency}, kalan ${formatCurrency(item.remaining, item.currency)}, ödenen ${formatCurrency(item.paid, item.currency)}`),
  ].join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilitySummary}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.heroRow}>
        <View style={[styles.amountColumn, { flexBasis: sizes.financialHeroAmountMinWidth * fontScale }]}>
          <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginBottom: gaps.heroLabel })}>{`Bu ay kalan · ${primary.currency}`}</Text>
          <Text style={textStyle('financialHero')}>{formatCurrency(primary.remaining, primary.currency)}</Text>
        </View>
        {primary.total.minorUnits > 0 ? <View accessible accessibilityRole="progressbar" accessibilityLabel="Bu ay ödenen oran" accessibilityValue={{ min: 0, max: 100, now: Math.round(fractionPaid(primary) * 100) }}>
          <ProgressRing size={sizes.financialHeroRing} progress={fractionPaid(primary)} color={colors.primary} trackColor={colors.border}>
            <Text style={textStyle('bodyStrong')}>{`%${Math.round(fractionPaid(primary) * 100)}`}</Text>
          </ProgressRing>
        </View> : null}
      </View>
      {allDone ? <View style={styles.doneRow}><MaterialIcons name="check-circle" size={sizes.checkIcon} color={statusColors.success} /><Text style={textStyle('label', { color: statusColors.success, marginLeft: spacing.xs, flexShrink: 1 })}>{others.some((item) => item.remaining.minorUnits > 0) ? `${primary.currency} ödemeleri tamam` : 'Bu ay tüm ödemeler tamam'}</Text></View> : null}
      <View style={styles.row}>
        <View style={styles.metric}><Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Ödenen</Text><Text style={textStyle('heading', { fontVariant: ['tabular-nums'] })}>{formatCurrency(primary.paid, primary.currency)}</Text></View>
        <View style={[styles.metric, styles.secondMetric]}><Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Toplam</Text><Text style={textStyle('heading', { fontVariant: ['tabular-nums'] })}>{formatCurrency(primary.total, primary.currency)}</Text></View>
      </View>
      {others.map((summary) => (
        <Text key={summary.currency} style={textStyle('caption', { marginTop: gaps.hint })}>
          {`${summary.currency}: kalan ${formatCurrency(summary.remaining, summary.currency)} · ödenen ${formatCurrency(summary.paid, summary.currency)}`}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.9 },
  doneRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  amountColumn: { flexGrow: 1, flexShrink: 1 },
  row: { flexDirection: 'row', marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  metric: { flex: 1, minWidth: 0 },
  secondMetric: { borderLeftWidth: borderWidth.hairline, borderLeftColor: colors.border, paddingLeft: spacing.lg },
}));
