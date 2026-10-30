import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, radius, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type MonthPaymentSummary } from '../domain/homeSummary';
import { type StripDay, type WeekTotal } from '../domain/weekSummary';
import { MonthStrip } from './MonthStrip';

/**
 * Ana sayfa başlığı: kutusuz, düz. Ana soru "önümüzdeki 7 günde ne çıkacak?"; tek para biriminde büyük tutar,
 * birden çoksa her birim kendi satırında aynı ağırlıkta. Altında ödeme sayısına göre gün şeridi (dokununca listeyi
 * o güne süzer) ve tek satır ay özeti ("Bu ay 5/9 ödeme tamam · Kalan ₺800 · $10"). Başlık İstatistikler'i açar.
 */
export function HeroCard({
  summaries,
  week,
  strip,
  selectedDay,
  onSelectDay,
  fallbackCurrency,
  unavailable = false,
  loading = false,
  onPress,
  onRetry,
  footer,
}: {
  summaries: readonly MonthPaymentSummary[];
  /** Önümüzdeki 7 günün para birimi başına tutarı; ilk eleman ana para birimidir. */
  week: readonly WeekTotal[];
  strip: readonly StripDay[];
  selectedDay: number | null;
  onSelectDay: (index: number | null) => void;
  /** Hiç özet yokken sıfırın gösterileceği para birimi (aktif para birimi). */
  fallbackCurrency: string;
  unavailable?: boolean;
  loading?: boolean;
  onPress: () => void;
  onRetry: () => void;
  /** Ay özeti satırının altına eklenen küçük öğeler (ör. gecikme uyarısı). */
  footer?: ReactNode;
}) {
  useThemeRevision();
  const withFooter = (content: ReactNode) => footer ? <View>{content}<View style={styles.footer}>{footer}</View></View> : content;
  if (loading) {
    return <View style={styles.block} accessibilityRole="progressbar" accessibilityLabel="Ödeme özeti yükleniyor" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>Ödeme özeti yükleniyor</Text>
    </View>;
  }
  if (unavailable) {
    return withFooter(
      <Pressable accessibilityRole="button" accessibilityLabel="Ödeme özeti yüklenemedi, tekrar dene" onPress={onRetry} style={styles.block}>
        <Text style={textStyle('label')}>Ödeme özeti kullanılamıyor</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
          Ödeme geçmişi yüklenemedi. Bağlantını kontrol edip tekrar dene.
        </Text>
        <Text style={textStyle('label', { color: colors.primary, marginTop: spacing.sm })}>Tekrar dene</Text>
      </Pressable>,
    );
  }
  // Başlıkta her para birimi kendi satırında, aynı ağırlıkta; tutarsız (sıfır) birimler satır almaz.
  const weekRows = week.filter((item) => item.total.minorUnits > 0);
  const shownWeek = weekRows.length > 0 ? weekRows : [week[0] ?? { currency: fallbackCurrency, total: Money.zero }];
  const multi = shownWeek.length > 1;
  // Ay ilerlemesi ödeme adedine göre; birimler karıştırılmaz.
  const paidCount = summaries.reduce((sum, item) => sum + item.paidCount, 0);
  const totalCount = paidCount + summaries.reduce((sum, item) => sum + item.dueCount, 0);
  const left = summaries.filter((item) => item.remaining.minorUnits > 0).map((item) => formatCurrency(item.remaining, item.currency));
  const allDone = left.length === 0 && paidCount > 0;
  const monthText = allDone ? 'Bu ay tüm ödemeler tamam' : totalCount === 0 ? 'Bu ay ödeme yok' : `Bu ay ${paidCount}/${totalCount} ödeme tamam · Kalan ${left.join(' · ')}`;
  const accessibilitySummary = [
    'Önümüzdeki 7 günün ve bu ayın özeti, istatistikleri aç',
    ...shownWeek.map((item) => `7 günde ${formatCurrency(item.total, item.currency)}`),
    monthText,
  ].join(', ');
  return withFooter(
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilitySummary} onPress={onPress} style={({ pressed }) => [styles.block, pressed && styles.pressed]}>
        <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>Önümüzdeki 7 gün</Text>
        {shownWeek.map((item) => (
          <View key={item.currency} style={styles.amountLine}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={textStyle(multi ? 'headline' : 'financialHero', { flexShrink: 1 })}>{formatCurrency(item.total, item.currency)}</Text>
            <Text style={textStyle('caption', { marginLeft: spacing.xs, marginBottom: multi ? spacing.xs : spacing.sm })}>{item.currency}</Text>
          </View>
        ))}
      </Pressable>
      <View style={styles.strip}>
        <MonthStrip days={strip} selected={selectedDay} onSelect={onSelectDay} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Bu ayın özeti, istatistikleri aç" onPress={onPress} style={styles.monthLine}>
        {allDone ? <MaterialIcons name="check-circle" size={16} color={statusColors.success} /> : null}
        <Text style={textStyle('bodySmall', { color: allDone ? statusColors.success : colors.onSurfaceVariant, flexShrink: 1 })}>{monthText}</Text>
      </Pressable>
    </View>,
  );
}

const styles = themedStyles(() => StyleSheet.create({
  block: { width: '100%' },
  pressed: { opacity: 0.85 },
  amountLine: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xxs },
  strip: { marginTop: spacing.md },
  monthLine: { minHeight: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, borderRadius: radius.sm },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
}));
