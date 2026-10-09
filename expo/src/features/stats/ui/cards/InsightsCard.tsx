import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/palette';
import { textStyle } from '../../../../shared/design/typography';
import { monthlyEquivalent, type Subscription } from '../../../subscriptions/domain/subscription';
import { StatsCardSurface } from './StatsCardSurface';

/**
 * Flutter `InsightsCard`: en yüksek gider kalemi (aylık toplamdaki yüzdesiyle) ve 7 gün içinde yenilenecekler
 * için uyarı şeridi ("İncele" düğmesi tasarruf analizine götürür).
 */
export function InsightsCard({
  highest,
  total,
  currency,
  dueSoon,
  onReviewDue,
}: {
  highest: Subscription | null;
  total: Money;
  currency: string;
  dueSoon: Subscription[];
  onReviewDue: () => void;
}) {
  const sharePct = highest && total.minorUnits > 0 ? Math.round((monthlyEquivalent(highest).minorUnits / total.minorUnits) * 100) : 0;
  return (
    <StatsCardSurface>
      <Text style={textStyle('cardTitle')}>Öne çıkanlar</Text>
      <View style={styles.gap} />
      {highest ? (
        <View style={styles.highest}>
          <View style={styles.avatar}>
            <Text style={textStyle('topBarTitle', { color: colors.primary })}>{highest.name.length > 0 ? highest.name[0].toUpperCase() : '?'}</Text>
          </View>
          <View style={styles.highestText}>
            <Text style={textStyle('bodySmallStrong')} numberOfLines={1}>{`En Yüksek Gider: ${highest.name}`}</Text>
            <Text style={textStyle('caption12', { marginTop: spacing.xxs / 2 })}>{`Aylık abonelik giderlerinin %${sharePct}’ini oluşturuyor.`}</Text>
          </View>
          <Text style={textStyle('bodySmallStrong', { marginLeft: spacing.xs })}>{formatCurrency(monthlyEquivalent(highest), currency)}</Text>
        </View>
      ) : null}
      {dueSoon.length > 0 ? (
        <View style={[styles.banner, { marginTop: gaps.sectionInner }]}>
          <MaterialIcons name="warning-amber" size={sizes.warningIcon} color={chartColors.amber} />
          <View style={styles.bannerText}>
            <Text style={textStyle('bodySmallStrong')}>{`${dueSoon.length} abonelik 7 gün içinde yenilenecek`}</Text>
            <Text style={textStyle('caption12', { marginTop: spacing.xxs / 2 })} numberOfLines={1}>
              {dueSoon.map((subscription) => subscription.name).join(', ')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onReviewDue} style={styles.review}>
            <Text style={textStyle('badge', { color: colors.secondary })}>İncele</Text>
          </Pressable>
        </View>
      ) : null}
    </StatsCardSurface>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: gaps.cardInset,
  },
  highest: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: gaps.sectionInner + 2,
    borderRadius: radius.tile - 2,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.4),
    backgroundColor: colors.background,
  },
  avatar: {
    width: sizes.insightAvatar,
    height: sizes.insightAvatar,
    borderRadius: sizes.insightAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.15),
  },
  highestText: {
    flex: 1,
    marginLeft: gaps.sectionInner,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: gaps.sectionInner + 2,
    borderRadius: radius.tile - 2,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(chartColors.amber, 0.25),
    backgroundColor: withAlpha(chartColors.amber, 0.08),
  },
  bannerText: {
    flex: 1,
    marginLeft: gaps.sectionInner,
  },
  review: {
    minHeight: sizes.minTouchTarget - spacing.xs,
    marginLeft: spacing.xs,
    paddingHorizontal: gaps.sectionInner - 2 + spacing.xxs / 2,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryContainer,
  },
});
