import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ProgressBar } from '../../../shared/widgets/ProgressBar';
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
  onPress,
}: {
  summaries: readonly MonthPaymentSummary[];
  /** Hiç özet yokken sıfırın gösterileceği para birimi (aktif para birimi). */
  fallbackCurrency: string;
  onPress: () => void;
}) {
  useThemeRevision();
  const primary: MonthPaymentSummary = summaries[0] ?? {
    currency: fallbackCurrency,
    paid: Money.zero,
    remaining: Money.zero,
    total: Money.zero,
  };
  const others = summaries.slice(1);
  const allDone = primary.remaining.minorUnits === 0 && primary.paid.minorUnits > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Bu ayın özeti, istatistikleri aç"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginBottom: gaps.heroLabel })}>Bu ay kalan ödemeler</Text>
      {allDone ? (
        <View style={styles.doneRow}>
          <MaterialIcons name="check-circle" size={sizes.checkIcon} color={statusColors.success} />
          <Text style={textStyle('title', { marginLeft: spacing.xs })}>Bu ay tüm ödemeler tamam</Text>
        </View>
      ) : (
        <Text style={textStyle('display')} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {formatCurrency(primary.remaining, primary.currency)}
        </Text>
      )}
      <View style={styles.bar}>
        <ProgressBar fraction={fractionPaid(primary)} accessibilityLabel="Bu ay ödenen oran" />
      </View>
      <View style={styles.row}>
        <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{`Ödenen ${formatCurrency(primary.paid, primary.currency)}`}</Text>
        <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{`Toplam ${formatCurrency(primary.total, primary.currency)}`}</Text>
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
    padding: spacing.lg,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceHigh,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.9 },
  doneRow: { flexDirection: 'row', alignItems: 'center' },
  bar: { marginTop: gaps.rowLoose, marginBottom: gaps.heroLabel },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
}));
