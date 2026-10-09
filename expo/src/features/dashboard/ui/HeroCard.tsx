import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { type Money } from '../../../core/domain/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AnimatedMoney } from '../../../shared/widgets/AnimatedMoney';
import { ProgressRing } from '../../../shared/widgets/ProgressRing';

/**
 * Flutter `DashboardHeroCard`: aylık tahmini gider (para birimi başına, sayma animasyonlu), aktif
 * aboneliklerin bu ayki ödeme halkası, geçen aya göre değişim ve analiz bağlantısı.
 */
export function HeroCard({
  totals,
  monthChange,
  completed,
  totalActive,
  onAnalysis,
}: {
  totals: ReadonlyMap<string, Money>;
  monthChange: string | null;
  completed: number;
  totalActive: number;
  onAnalysis: (() => void) | null;
}) {
  const decreased = monthChange?.includes('daha az') ?? false;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.totals}>
          <Text style={textStyle('bodySmallStrong', { color: withAlpha(colors.onSurfaceVariant, 0.9), letterSpacing: 0.3, marginBottom: gaps.heroLabel })}>
            Tahmini aylık abonelik gideri
          </Text>
          {totals.size === 0 ? (
            <Text style={textStyle('amountLarge')}>₺0,00</Text>
          ) : (
            [...totals.entries()].map(([currency, money]) => (
              <AnimatedMoney key={currency} amount={money.amount} currency={currency} style={textStyle('amountLarge')} />
            ))
          )}
        </View>
        {totalActive > 0 ? (
          <Pressable accessibilityRole="button" disabled={!onAnalysis} onPress={onAnalysis ?? undefined}>
            <ProgressRing
              size={sizes.ringSize}
              progress={completed / totalActive}
              color={colors.primary}
              trackColor={withAlpha(colors.primary, 0.15)}
            >
              <Text style={textStyle('ringValue')}>{`${completed}/${totalActive}`}</Text>
              <Text style={textStyle('ringLabel', { color: withAlpha(colors.onSurfaceVariant, 0.9) })}>ödendi</Text>
            </ProgressRing>
          </Pressable>
        ) : null}
      </View>

      {monthChange ? (
        <View style={styles.changeRow}>
          <MaterialIcons
            name={decreased ? 'trending-down' : 'trending-up'}
            size={sizes.heroIcon}
            color={decreased ? statusColors.success : statusColors.warning}
          />
          <Text
            style={textStyle('bodySmallStrong', {
              marginLeft: gaps.heroLabel,
              color: decreased ? statusColors.success : colors.onSurfaceVariant,
            })}
          >
            {monthChange}
          </Text>
        </View>
      ) : null}

      {onAnalysis ? (
        <Pressable accessibilityRole="button" onPress={onAnalysis} style={styles.analysisLink}>
          <Ionicons name="bar-chart-outline" size={sizes.heroIcon} color={colors.primary} />
          <Text style={textStyle('bodySmallStrong', { flex: 1, marginLeft: spacing.xs, color: withAlpha(colors.onSurface, 0.85) })}>
            Abonelik giderlerini incele
          </Text>
          <MaterialIcons name="chevron-right" size={sizes.chevronIcon} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceHigh,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  totals: {
    flex: 1,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  analysisLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gaps.rowLoose,
    paddingVertical: spacing.xxs,
  },
});
