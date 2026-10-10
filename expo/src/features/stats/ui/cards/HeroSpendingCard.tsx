import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/palette';
import { textStyle } from '../../../../shared/design/typography';
import { StatsCardSurface } from './StatsCardSurface';

/**
 * Flutter `HeroSpendingCard`: "TAHMİNİ AYLIK ABONELİK GİDERİ", aktif sayısı rozeti, büyük aylık tutar,
 * önceki aya göre değişim rozeti ve yıllık toplam. Değişim, bu ayın tahmini ile geçen ayın ödemeleri arasında.
 */
export function HeroSpendingCard({
  monthly,
  yearly,
  currency,
  activeCount,
  trend,
  hasPaymentHistory,
}: {
  monthly: Money;
  yearly: Money;
  currency: string;
  activeCount: number;
  trend: number[];
  hasPaymentHistory: boolean;
}) {
  const hasComparison = trend.length >= 2 && trend[trend.length - 2] > 0;
  // Değişim, ödeme geçmişinin bu ay ile geçen ay toplamı arasındaki farktır (ana sayfadaki yüzdeyle aynı kaynak).
  const change = trend.length >= 2 ? trend[trend.length - 1] - trend[trend.length - 2] : 0;
  return (
    <StatsCardSurface padding={sizes.heroPadding}>
      <View style={styles.titleRow}>
        <Text style={textStyle('overline', { flex: 1 })} numberOfLines={1}>
          TAHMİNİ AYLIK ABONELİK GİDERİ
        </Text>
        <View style={styles.activePill}>
          <Text style={textStyle('badge', { color: colors.primary })}>{`${activeCount} Aktif`}</Text>
        </View>
      </View>
      <Text style={textStyle('heroAmount', { marginTop: spacing.sm + spacing.xxs / 2 })}>{formatCurrency(monthly, currency)}</Text>
      <View style={styles.changeRow}>
        <ChangeBadge change={change} currency={currency} hasPaymentHistory={hasPaymentHistory && hasComparison} />
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginLeft: gaps.chip - 1, flex: 1 })} numberOfLines={1}>
          {`Yıllık ${formatCurrency(yearly, currency)}`}
        </Text>
      </View>
    </StatsCardSurface>
  );
}

/** Değişim rozeti: azalış, artış, aynı seviye ya da geçmiş yoksa tahmin etiketi (Flutter `_ChangeBadge`). */
function ChangeBadge({ change, currency, hasPaymentHistory }: { change: number; currency: string; hasPaymentHistory: boolean }) {
  const look = badgeLook(change, currency, hasPaymentHistory);
  return (
    <View style={[styles.badge, { backgroundColor: look.background }]}>
      <MaterialIcons name={look.icon} size={sizes.badgeIcon} color={look.color} />
      <Text style={textStyle('badge', { color: look.color, marginLeft: spacing.xxs })}>{look.label}</Text>
    </View>
  );
}

function badgeLook(change: number, currency: string, hasPaymentHistory: boolean) {
  if (!hasPaymentHistory) {
    return { icon: 'calendar-today' as const, label: 'Tahmini aylık gider', color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest };
  }
  if (change === 0) {
    return { icon: 'horizontal-rule' as const, label: 'Aynı seviyede', color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest };
  }
  const down = change < 0;
  const amount = formatCurrency(Money.fromMinorUnits(Math.abs(change)), currency);
  const color = down ? chartColors.decrease : colors.error;
  return {
    icon: down ? ('south-east' as const) : ('north-east' as const),
    label: `${amount} ${down ? 'azalış' : 'artış'}`,
    color,
    background: withAlpha(color, 0.15),
  };
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePill: {
    paddingHorizontal: spacing.sm - spacing.xxs / 2 + spacing.xxs / 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.12),
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gaps.rowLoose - 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm - spacing.xxs / 2,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.field - 4,
  },
});

