import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatCurrency } from '../../../core/format/money';
import { formatRelativeDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { type Money } from '../../../core/domain/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';
import { daysUntilRenewal, type Subscription } from '../../subscriptions/domain/subscription';

/** Flutter `DashboardNextPaymentCard`: sıradaki ödeme, 3 gün ve altında kırmızıya yakın kenarlık. */
export function NextPaymentCard({ subscription, today, onPress }: { subscription: Subscription; today: CivilDate; onPress: () => void }) {
  const days = daysUntilRenewal(subscription, today) ?? 0;
  const urgent = days <= 3;
  const next = subscription.nextRenewalDate;
  const daysLabel = days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün kaldı`;
  const dateLabel = next ? formatRelativeDate(next, today) : '—';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: urgent ? withAlpha(colors.error, 0.5) : colors.border }, pressed && styles.pressed]}
    >
      <View style={styles.summary}>
        <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.nextPaymentAvatar} />
        <View style={styles.middle}>
          <Text style={textStyle('bodyLargeStrong')}>{subscription.name}</Text>
          <Text style={textStyle('bodySmallStrong', { color: urgent ? colors.error : statusColors.warning, marginTop: spacing.xxs - 1 })}>
            {days === 0 ? dateLabel : `${dateLabel} · ${daysLabel}`}
          </Text>
        </View>
        <View style={styles.trailing}>
          <Text style={textStyle('topBarTitle')}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
          <View style={styles.detailRow}>
            <Text style={textStyle('chipStrong', { color: colors.primary })}>Detay</Text>
            <MaterialIcons name="chevron-right" size={sizes.chevronSmall} color={colors.primary} />
          </View>
        </View>
      </View>
      <View style={styles.hint}>
        <Ionicons name="notifications-outline" size={sizes.hintIcon} color={colors.primary} />
        <Text style={textStyle('caption12', { flex: 1, marginLeft: gaps.hint, color: withAlpha(colors.onSurfaceVariant, 0.9) })}>
          Yenileme öncesi hatırlatmayı abonelik ayrıntılarından yönetebilirsin
        </Text>
        <Text style={textStyle('caption12Strong', { color: colors.primary })}>Hatırlatma ayarları</Text>
      </View>
    </Pressable>
  );
}

/** Flutter `DashboardEmptyRenewalsCard`: bu hafta yenileme yoksa. */
export function EmptyRenewalsCard() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyCircle}>
        <MaterialIcons name="check-circle-outline" size={sizes.emptyIcon} color={colors.primary} />
      </View>
      <Text style={[textStyle('bodySmallStrong'), styles.emptyTitle]}>Yaklaşan yenileme yok</Text>
      <Text style={[textStyle('bodySmall'), styles.emptyBody]}>Bu hafta yenileme yok.</Text>
    </View>
  );
}

/** Flutter `DashboardSavingsSummary`: tasarruf toplamları, para birimi başına "/yıl". */
export function SavingsSummaryCard({ totals }: { totals: ReadonlyMap<string, Money> }) {
  return (
    <View style={styles.savingsCard}>
      <Text style={textStyle('titleSmall')}>Tahmini yıllık tasarruf</Text>
      <Text style={[textStyle('bodySmall'), styles.savingsSubtitle]}>İptal edilen veya duraklatılan aboneliklerden</Text>
      {[...totals.entries()].map(([currency, money]) => (
        <View key={currency} style={styles.savingsRow}>
          <Text style={textStyle('bodySmall')}>{currency}</Text>
          <Text style={textStyle('bodyMediumStrong')}>{`${formatCurrency(money, currency)}/yıl`}</Text>
        </View>
      ))}
    </View>
  );
}

/** Flutter `DashboardEmptyIntro`: hiç abonelik yokken açıklama kutusu. */
export function EmptyIntro() {
  return (
    <View style={styles.intro}>
      <Text style={textStyle('bodyLargeStrong')}>Ana sayfanı oluşturmaya başla</Text>
      <Text style={[textStyle('bodySmall'), styles.introBody]}>
        Aboneliklerini ekle; aylık giderlerini, yenileme tarihlerini ve ücretsiz denemelerini tek yerde takip et.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.card,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: gaps.rowLoose,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs - 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gaps.cardInset - 4,
    paddingHorizontal: gaps.cardInset - 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: withAlpha(colors.surfaceContainerHighest, 0.5),
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyCircle: {
    width: sizes.emptyCircle,
    height: sizes.emptyCircle,
    borderRadius: sizes.emptyCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.primary, 0.2),
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  emptyTitle: {
    marginTop: gaps.rowLoose,
  },
  emptyBody: {
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  savingsCard: {
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  savingsSubtitle: {
    marginTop: gaps.heroLabel,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: gaps.cardInset - 4,
  },
  intro: {
    padding: gaps.cardInset + spacing.xxs - 4,
    borderRadius: radius.intro,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  introBody: {
    marginTop: spacing.xxs,
  },
});
