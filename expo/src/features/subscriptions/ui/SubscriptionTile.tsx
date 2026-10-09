import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription, daysUntilRenewal } from '../domain/subscription';
import { renewalLabel } from '../domain/renewalLabel';
import { isNotStarted } from '../domain/activeSelectors';
import { ServiceIdentity } from './ServiceIdentity';
import { SubscriptionStatusChip } from './SubscriptionStatusChip';

/**
 * Liste kartı (Flutter `SubscriptionListTile`): hizmet kimliği, ad, kategori · dönem, sağda tutar ve
 * yenileme etiketi. Duraklatılmış ve iptal edilmiş kayıtlar soluk; uyarı durumunda etiket kalındır.
 */
export function SubscriptionTile({
  subscription,
  today,
  onPress,
  showStatus = true,
}: {
  subscription: Subscription;
  today: CivilDate;
  onPress: () => void;
  showStatus?: boolean;
}) {
  const status = subscription.status;
  const dimmed = status === 'paused' || status === 'cancelled';
  const days = daysUntilRenewal(subscription, today);
  const chipVisible = showStatus && dimmed;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subscription.name}, ${formatCurrency(subscription.amount, subscription.currency)}`}
      onPress={onPress}
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

      <Trailing subscription={subscription} days={days} />
    </Pressable>
  );
}

function Trailing({ subscription, days }: { subscription: Subscription; days: number | null }) {
  const status = subscription.status;
  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';
  const urgent = days !== null && days <= 3;
  const labelColor = isPaused
    ? colors.onSurfaceVariant
    : isCancelled
      ? statusColors.success
      : urgent
        ? colors.error
        : withAlpha(colors.onSurfaceVariant, 0.85);
  const label = isPaused ? 'Duraklatıldı' : isCancelled ? 'İptal edildi' : days === null ? '—' : renewalLabel(days);
  return (
    <View style={styles.trailing}>
      <Text style={textStyle('topBarTitle', { color: isCancelled || isPaused ? colors.onSurfaceVariant : colors.onSurface })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
      <Text
        style={textStyle(urgent ? 'labelSmallStrong' : 'labelSmall', { color: labelColor, marginTop: gaps.legendRow - 1, textAlign: 'right' })}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
});
