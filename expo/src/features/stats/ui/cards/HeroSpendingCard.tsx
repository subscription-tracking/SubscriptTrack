import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/chartTheme';
import { textStyle } from '../../../../shared/design/typography';

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
    <View style={styles.hero}>
      <View style={styles.titleRow}>
        <Text style={textStyle('overline', { flex: 1 })}>
          TAHMİNİ AYLIK ABONELİK GİDERİ
        </Text>
        <View style={styles.activePill}>
          <Text style={textStyle('captionStrong', { color: colors.primary })}>{`${activeCount} ${currency} aktif`}</Text>
        </View>
      </View>
      <Text style={textStyle('financialHero', { marginTop: spacing.md })}>{formatCurrency(monthly, currency)}</Text>
      <View style={styles.annualRow}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Tahmini yıllık maliyet</Text>
        <Text style={textStyle('heading', { fontVariant: ['tabular-nums'] })}>{formatCurrency(yearly, currency)}</Text>
      </View>
      <View style={styles.changeRow}>
        {hasPaymentHistory && hasComparison ? <ChangeBadge change={change} currency={currency} hasPaymentHistory /> : null}
        {hasPaymentHistory && hasComparison ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Bu ay henüz tamamlanmadı; yalnızca kaydedilen ödemeler karşılaştırılır.</Text> : null}
      </View>
    </View>
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
  hero: { backgroundColor: colors.surface, borderRadius: radius.medium, padding: sizes.heroPadding },
  annualRow: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: borderWidth.hairline, borderTopColor: colors.border, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
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

