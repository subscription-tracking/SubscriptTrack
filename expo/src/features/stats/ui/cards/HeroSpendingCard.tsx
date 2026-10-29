import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/chartTheme';
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
  useThemeRevision();
  const hasComparison = trend.length >= 2 && trend[trend.length - 2] > 0;
  // Değişim, ödeme geçmişinin bu ay ile geçen ay toplamı arasındaki farktır (ana sayfadaki yüzdeyle aynı kaynak).
  const change = trend.length >= 2 ? trend[trend.length - 1] - trend[trend.length - 2] : 0;
  return (
    <StatsCardSurface padding={sizes.heroPadding}>
      <View style={styles.titleRow}>
        <Text style={textStyle('overline', { flex: 1 })}>
          TAHMİNİ AYLIK ABONELİK GİDERİ
        </Text>
        <View style={styles.activePill}>
          <Text style={textStyle('captionStrong', { color: colors.primary })}>{`${activeCount} Aktif`}</Text>
        </View>
      </View>
      <Text style={textStyle('display', { marginTop: spacing.sm + spacing.xxs / 2 })}>{formatCurrency(monthly, currency)}</Text>
      <View style={styles.changeRow}>
        <ChangeBadge change={change} currency={currency} hasPaymentHistory={hasPaymentHistory && hasComparison} />
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          {`Tahmini yıllık ${formatCurrency(yearly, currency)}`}
        </Text>
      </View>
    </StatsCardSurface>
  );
}

/** Değişim rozeti: azalış, artış, aynı seviye ya da geçmiş yoksa tahmin etiketi (Flutter `_ChangeBadge`). */
function ChangeBadge({ change, currency, hasPaymentHistory }: { change: number; currency: string; hasPaymentHistory: boolean }) {
  useThemeRevision();
  const look = badgeLook(change, currency, hasPaymentHistory);
  return (
    <View style={[styles.badge, { backgroundColor: look.background }]}>
      <MaterialIcons name={look.icon} size={sizes.badgeIcon} color={look.color} />
      <Text style={textStyle('captionStrong', { color: look.color, marginLeft: spacing.xxs, flexShrink: 1 })}>{look.label}</Text>
    </View>
  );
}

function badgeLook(change: number, currency: string, hasPaymentHistory: boolean) {
  if (!hasPaymentHistory) {
    return { icon: 'calendar-today' as const, label: 'Tahmini aylık gider', color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest };
  }
  if (change === 0) {
    return { icon: 'horizontal-rule' as const, label: 'Kayıtlı ödemeler geçen ayla aynı', color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest };
  }
  const down = change < 0;
  const amount = formatCurrency(Money.fromMinorUnits(Math.abs(change)), currency);
  const color = down ? chartColors.decrease : colors.error;
  return {
    icon: down ? ('south-east' as const) : ('north-east' as const),
    label: `Kayıtlı ödemeler geçen aya göre ${amount} ${down ? 'azaldı' : 'arttı'}`,
    color,
    background: withAlpha(color, 0.15),
  };
}

const styles = themedStyles(() => StyleSheet.create({
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
    alignItems: 'flex-start',
    marginTop: gaps.rowLoose - 2,
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    paddingHorizontal: spacing.sm - spacing.xxs / 2,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.field - 4,
  },
}));

