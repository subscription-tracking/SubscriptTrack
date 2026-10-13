import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AnimatedMoney } from '../../../shared/widgets/AnimatedMoney';
import { ProgressRing } from '../../../shared/widgets/ProgressRing';

/**
 * Flutter `DashboardHeroCard`: aylık tahmini gider (para birimi başına, sayma animasyonlu), aktif
 * aboneliklerin bu ayki ödeme halkası, geçen ay ödenen toplam ve analiz bağlantısı.
 */
export function HeroCard({
  totals,
  monthChange,
  completed,
  totalActive,
  onAnalysis,
  fallbackCurrency = 'TRY',
}: {
  totals: ReadonlyMap<string, Money>;
  /** Toplam yokken sıfırın gösterileceği para birimi (aktif para birimi). */
  fallbackCurrency?: string;
  monthChange: string | null;
  completed: number;
  totalActive: number;
  onAnalysis: (() => void) | null;
}) {
  useThemeRevision();
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.totals}>
          <Text style={textStyle('label', { color: colors.onSurfaceVariant, letterSpacing: 0.3, marginBottom: gaps.heroLabel })}>
            Tahmini aylık abonelik gideri
          </Text>
          {totals.size === 0 ? (
            <Text style={textStyle('display')} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {formatCurrency(Money.zero, fallbackCurrency)}
            </Text>
          ) : (
            [...totals.entries()].map(([currency, money]) => (
              <AnimatedMoney key={currency} amount={money.amount} currency={currency} style={textStyle('display')} fit />
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
              <Text style={textStyle('label')}>{`${completed}/${totalActive}`}</Text>
              <Text style={textStyle('caption')}>ödendi</Text>
            </ProgressRing>
          </Pressable>
        ) : null}
      </View>

      {monthChange ? (
        <View style={styles.changeRow}>
          <MaterialIcons name="history" size={sizes.heroIcon} color={colors.onSurfaceVariant} />
          <Text style={textStyle('label', { marginLeft: gaps.heroLabel, color: colors.onSurfaceVariant })}>
            {monthChange}
          </Text>
        </View>
      ) : null}

      {onAnalysis ? (
        <Pressable accessibilityRole="button" onPress={onAnalysis} style={styles.analysisLink}>
          <Ionicons name="bar-chart-outline" size={sizes.heroIcon} color={colors.primary} />
          <Text style={textStyle('label', { flex: 1, marginLeft: spacing.xs })}>
            Abonelik giderlerini incele
          </Text>
          <MaterialIcons name="chevron-right" size={sizes.chevronIcon} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
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
}));
