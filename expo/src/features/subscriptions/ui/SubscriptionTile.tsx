import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription, daysUntilRenewal } from '../domain/subscription';
import { renewalLabel } from '../domain/renewalLabel';
import { advancedRenewalDate } from '../domain/renewalOverdue';
import { isNotStarted } from '../domain/activeSelectors';
import { statusChipState } from '../domain/statusChip';
import { ServiceIdentity } from './ServiceIdentity';
import { SubscriptionStatusChip } from './SubscriptionStatusChip';

/**
 * Liste kartı (Flutter `SubscriptionListTile`): hizmet kimliği, ad, kategori · dönem, sağda tutar ve
 * yenileme etiketi. Duraklatılmış ve iptal edilmiş kayıtlar soluk; uyarı durumunda etiket kalındır.
 */
export const SubscriptionTile = memo(function SubscriptionTile({
  subscription,
  today,
  onPress,
  showStatus = true,
}: {
  subscription: Subscription;
  today: CivilDate;
  /** Satırın kimliğiyle çağrılır; kararlı bir işleyici verilirse memo etkili olur. */
  onPress: (id: string) => void;
  showStatus?: boolean;
}) {
  useThemeRevision();
  const status = subscription.status;
  const dimmed = status === 'paused' || status === 'cancelled' || status === 'expired';
  const days = daysUntilRenewal(subscription, today);
  const chipVisible = showStatus && dimmed;
  const statusLabel = statusChipState({ status, isNotStarted: isNotStarted(subscription, today), daysUntilRenewal: days }).label;
  const dateLabel = status === 'trial'
    ? subscription.trialEndDate ? `Deneme bitişi ${formatLongDate(subscription.trialEndDate)}` : ''
    : status === 'active'
      ? subscription.nextRenewalDate ? `Yenileme ${formatLongDate(subscription.nextRenewalDate)}` : 'Yenileme tarihi yok'
      : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[subscription.name, CATEGORY_LABELS[subscription.category], BILLING_CYCLE_LABELS[subscription.billingCycle], formatCurrency(subscription.amount, subscription.currency), statusLabel, dateLabel].filter(Boolean).join(', ')}
      onPress={() => onPress(subscription.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={{ opacity: dimmed ? 0.55 : 1 }}>
        <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.listAvatar} />
      </View>

      <View style={styles.middle}>
        <Text
          numberOfLines={1}
          style={textStyle('bodySmallStrong', {
            textDecorationLine: status === 'cancelled' ? 'line-through' : 'none',
          })}
        >
          {subscription.name}
        </Text>
        <View style={styles.subtitleRow}>
          <Text numberOfLines={1} style={textStyle('caption12', { flexShrink: 1, color: withAlpha(colors.onSurfaceVariant, 0.9) })}>
            {`${CATEGORY_LABELS[subscription.category]} · ${BILLING_CYCLE_LABELS[subscription.billingCycle]}`}
          </Text>
          {chipVisible ? (
            <View style={styles.chipGap}>
              <SubscriptionStatusChip
                status={status}
                isNotStarted={isNotStarted(subscription, today)}
                daysUntilRenewal={days}
              />
            </View>
          ) : null}
        </View>
      </View>

      <Trailing subscription={subscription} days={days} today={today} />
    </Pressable>
  );
});

function Trailing({ subscription, days, today }: { subscription: Subscription; days: number | null; today: CivilDate }) {
  useThemeRevision();
  const status = subscription.status;
  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';
  const isExpired = status === 'expired';
  const urgent = days !== null && days <= 3;
  const labelColor = isPaused || isExpired
    ? colors.onSurfaceVariant
    : isCancelled
      ? statusColors.success
      : urgent
        ? colors.error
        : withAlpha(colors.onSurfaceVariant, 0.85);
  const label = isPaused ? 'Duraklatıldı' : isCancelled ? 'İptal edildi' : isExpired ? 'Süresi doldu' : isNotStarted(subscription, today) ? 'Henüz başlamadı' : days === null ? '—' : days < 0 ? 'Gecikmiş vade' : renewalLabel(days);
  const upcoming = days !== null && days < 0 ? advancedRenewalDate(subscription, today) : null;
  return (
    <View style={styles.trailing}>
      {upcoming ? <Text style={textStyle('caption')}>{`Sonraki döngü (tahmini): ${formatLongDate(upcoming)}`}</Text> : null}
      <Text style={textStyle('topBarTitle', { color: isCancelled || isPaused || isExpired ? colors.onSurfaceVariant : colors.onSurface })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
      <Text
        style={textStyle(urgent ? 'labelSmallStrong' : 'labelSmall', { color: labelColor, marginTop: gaps.legendRow - 1, textAlign: 'right' })}
      >
        {upcoming && subscription.nextRenewalDate ? `${label}: ${formatLongDate(subscription.nextRenewalDate)}` : label}
      </Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 1,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  middle: {
    flex: 1,
    marginLeft: gaps.rowLoose - 2,
    marginRight: gaps.rowLoose - 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs / 2,
  },
  chipGap: {
    marginLeft: gaps.heroLabel,
  },
  trailing: {
    alignItems: 'flex-end',
    maxWidth: '48%',
    flexShrink: 1,
  },
}));
