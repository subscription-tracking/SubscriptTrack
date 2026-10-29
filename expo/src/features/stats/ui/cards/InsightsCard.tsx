import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/chartTheme';
import { textStyle } from '../../../../shared/design/typography';
import { monthlyEquivalent, type Subscription } from '../../../subscriptions/domain/subscription';
import { ServiceIdentity } from '../../../subscriptions/ui/ServiceIdentity';

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
  useThemeRevision();
  const sharePct = highest && total.minorUnits > 0 ? Math.round((monthlyEquivalent(highest).minorUnits / total.minorUnits) * 100) : 0;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={textStyle('heading')}>Öne çıkanlar</Text>
      <View style={styles.gap} />
      {highest ? (
        <View style={styles.highest} accessible accessibilityLabel={`${highest.name}, tahmini aylık ${formatCurrency(monthlyEquivalent(highest), currency)}, toplamın yüzde ${sharePct}`}>
          <ServiceIdentity name={highest.name} category={highest.category} size={sizes.insightAvatar} compact />
          <View style={styles.highestText}>
            <Text style={textStyle('label')}>{`En yüksek tahmini gider: ${highest.name}`}</Text>
            <Text style={textStyle('caption', { marginTop: spacing.xxs / 2 })}>{`Aylık toplamın %${sharePct} kadarını oluşturuyor.`}</Text>
          </View>
          <Text style={textStyle('label', { marginLeft: spacing.xs })}>{formatCurrency(monthlyEquivalent(highest), currency)}</Text>
        </View>
      ) : null}
      {dueSoon.length > 0 ? (
        <View style={[styles.banner, { marginTop: gaps.sectionInner }]}>
          <MaterialIcons name="warning-amber" size={sizes.warningIcon} color={chartColors.amber} />
          <View style={styles.bannerText}>
            <Text style={textStyle('label')}>{`${dueSoon.length} abonelik yarından itibaren 7 gün içinde yenilenecek · tüm para birimleri`}</Text>
            <Text style={textStyle('caption', { marginTop: spacing.xxs / 2 })}>
              {dueSoon.slice(0, 3).map((subscription) => subscription.name).join(', ')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onReviewDue} style={styles.review}>
            <Text style={textStyle('captionStrong', { color: colors.secondary })}>İncele</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: { paddingVertical: spacing.md },
  gap: {
    height: gaps.cardInset,
  },
  highest: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  highestText: {
    flex: 1, minWidth: 0,
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
    minHeight: sizes.minTouchTarget,
    marginLeft: spacing.xs,
    paddingHorizontal: gaps.sectionInner - 2 + spacing.xxs / 2,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryContainer,
  },
}));
