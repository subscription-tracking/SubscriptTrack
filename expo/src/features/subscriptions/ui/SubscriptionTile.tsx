import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate, monthShort } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, sizes, spacing, statusColors } from '../../../shared/design/tokens';
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
  const dueDate = status === 'trial' ? subscription.trialEndDate : status === 'active' ? subscription.nextRenewalDate : null;
  const dueDateShort = dueDate ? `${dueDate.day} ${monthShort(dueDate.month)}${dueDate.year !== today.year ? ` ${dueDate.year}` : ''}` : '';

  const upcoming = days !== null && days < 0 ? advancedRenewalDate(subscription, today) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[subscription.name, CATEGORY_LABELS[subscription.category], BILLING_CYCLE_LABELS[subscription.billingCycle], formatCurrency(subscription.amount, subscription.currency), statusLabel, dateLabel].filter(Boolean).join(', ')}
      onPress={() => onPress(subscription.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={{ opacity: dimmed ? 0.55 : 1 }}>
          <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.listAvatar} />
        </View>

        <View style={styles.middle}>
          <Text
            style={textStyle('label', {
              textDecorationLine: status === 'cancelled' ? 'line-through' : 'none',
            })}
          >
            {subscription.name}
          </Text>
          <View style={styles.subtitleRow}>
            <Text numberOfLines={1} style={textStyle('caption', { flexShrink: 1 })}>
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

        <Trailing subscription={subscription} days={days} today={today} dueDateShort={dueDateShort} />
      </View>
      {upcoming ? (
        <Text style={[textStyle('caption'), styles.note]}>
          {`Sonraki döngü (tahmini): ${formatLongDate(upcoming)}`}
        </Text>
      ) : null}
    </Pressable>
  );
});

function Trailing({ subscription, days, today, dueDateShort }: { subscription: Subscription; days: number | null; today: CivilDate; dueDateShort: string }) {
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
        : colors.onSurfaceVariant;
  const label = isPaused ? 'Duraklatıldı' : isCancelled ? 'İptal edildi' : isExpired ? 'Süresi doldu' : isNotStarted(subscription, today) ? 'Henüz başlamadı' : days === null ? '—' : days < 0 ? `${-days} gün gecikti` : renewalLabel(days);
  return (
    <View style={styles.trailing}>
      <Text style={textStyle('heading', { color: isCancelled || isPaused || isExpired ? colors.onSurfaceVariant : colors.onSurface })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
      <Text
        style={textStyle(urgent ? 'captionStrong' : 'caption', { color: labelColor, marginTop: gaps.legendRow - 1, textAlign: 'right' })}
      >
        {dueDateShort ? `${label} · ${dueDateShort}` : label}
      </Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    minHeight: sizes.minTouchTarget,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  note: {
    marginTop: spacing.xs,
    marginLeft: sizes.listAvatar + spacing.sm,
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
