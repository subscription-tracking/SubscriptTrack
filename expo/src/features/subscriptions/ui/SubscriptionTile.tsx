import { Pressable, StyleSheet, Text, View } from 'react-native';
import { sizes, spacing } from '../../../shared/design/tokens';

import { formatCurrency } from '../../../core/format/money';
import { borderWidth, colors, radius, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, STATUS_LABELS, type Subscription, daysUntilRenewal } from '../domain/subscription';
import { renewalLabel } from '../domain/renewalLabel';
import { OVERDUE_LABEL, isOverdueRenewal } from '../domain/renewalOverdue';
import { isRenewingSoon } from '../domain/subscriptionList';
import { type CivilDate } from '../../../core/time/calendar';

/** Liste kartı (Flutter `SubscriptionListTile`). Yenileme yaklaşan aktif kayıtlar vurgulanır. */
export function SubscriptionTile({
  subscription,
  today,
  onPress,
}: {
  subscription: Subscription;
  today: CivilDate;
  onPress: () => void;
}) {
  const dimmed = subscription.status === 'paused' || subscription.status === 'cancelled';
  const cancelled = subscription.status === 'cancelled';
  const soon = isRenewingSoon(subscription, today);
  const days = daysUntilRenewal(subscription, today);
  const showStatus = dimmed;
  const overdue = isOverdueRenewal(subscription, today);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subscription.name}, ${formatCurrency(subscription.amount, subscription.currency)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, soon && styles.cardSoon, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, dimmed && styles.dimmed]}>
        <Text style={textStyle('titleSmall', { color: colors.primary })}>{subscription.name.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
      </View>

      <View style={styles.middle}>
        <Text
          numberOfLines={1}
          style={textStyle('titleSmall', {
            textDecorationLine: cancelled ? 'line-through' : 'none',
          })}
        >
          {subscription.name}
        </Text>
        <View style={styles.subtitleRow}>
          <Text numberOfLines={1} style={textStyle('caption', { flexShrink: 1 })}>
            {CATEGORY_LABELS[subscription.category]} · {BILLING_CYCLE_LABELS[subscription.billingCycle]}
          </Text>
          {showStatus ? (
            <Text style={textStyle('caption', { color: statusColors.muted, marginLeft: spacing.xs })}>
              {STATUS_LABELS[subscription.status]}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={textStyle('titleSmall')}>
          {formatCurrency(subscription.amount, subscription.currency)}
        </Text>
        {days !== null && subscription.status !== 'cancelled' && subscription.status !== 'expired' ? (
          <Text style={textStyle('caption', { color: overdue ? statusColors.warning : soon ? colors.primary : colors.onSurfaceVariant })}>
            {overdue ? OVERDUE_LABEL : renewalLabel(days)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.hairline,
    borderColor: colors.outline,
  },
  cardSoon: {
    borderColor: colors.primary,
    borderWidth: borderWidth.focused,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: sizes.avatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  dimmed: {
    opacity: 0.55,
  },
  middle: {
    flex: 1,
    gap: spacing.xxs,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
});
