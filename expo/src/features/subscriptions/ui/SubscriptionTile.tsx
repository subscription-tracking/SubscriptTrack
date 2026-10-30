import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { memo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription, daysUntilRenewal } from '../domain/subscription';
import { renewalLabel } from '../domain/renewalLabel';
import { isNotStarted } from '../domain/activeSelectors';
import { statusChipState } from '../domain/statusChip';
import { pressFeedback } from '../../../shared/haptics';
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
  selected,
  position = 'single',
  onLongPress,
}: {
  subscription: Subscription;
  today: CivilDate;
  /** Satırın kimliğiyle çağrılır; kararlı bir işleyici verilirse memo etkili olur. */
  onPress: (id: string) => void;
  showStatus?: boolean;
  selected?: boolean;
  /** Gruplanmış kartta satırın yeri: köşe yuvarlama ve kenarlık buna göre. */
  position?: 'single' | 'first' | 'middle' | 'last';
  /** Uzun basınca (ör. çoklu seçimi başlatmak için) satırın kimliğiyle çağrılır. */
  onLongPress?: (id: string) => void;
}) {
  useThemeRevision();
  const status = subscription.status;
  const dimmed = status === 'paused' || status === 'cancelled' || status === 'expired';
  const days = daysUntilRenewal(subscription, today);
  const statusLabel = statusChipState({ status, isNotStarted: isNotStarted(subscription, today), daysUntilRenewal: days }).label;
  const dateLabel = status === 'trial'
    ? subscription.trialEndDate ? `Deneme bitişi ${formatLongDate(subscription.trialEndDate)}` : ''
    : status === 'active'
      ? subscription.nextRenewalDate ? `Yenileme ${formatLongDate(subscription.nextRenewalDate)}` : 'Yenileme tarihi yok'
      : '';

  return (
    <Pressable
      accessibilityRole={selected === undefined ? 'button' : 'checkbox'}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
      accessibilityLabel={[subscription.name, CATEGORY_LABELS[subscription.category], BILLING_CYCLE_LABELS[subscription.billingCycle], formatCurrency(subscription.amount, subscription.currency), statusLabel, dateLabel].filter(Boolean).join(', ')}
      onPress={() => onPress(subscription.id)}
      onLongPress={onLongPress ? () => { pressFeedback(); onLongPress(subscription.id); } : undefined}
      style={({ pressed }) => [styles.card, position === 'single' && styles.single, position === 'first' && styles.first, position === 'middle' && styles.middleRow, position === 'last' && styles.last, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        {selected !== undefined ? <View accessible={false} style={[styles.check, selected && styles.checkOn]}>{selected ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}</View> : null}
        <View style={{ opacity: dimmed ? 0.55 : 1 }}>
          <ServiceIdentity name={subscription.name} category={subscription.category} size={52} compact />
        </View>

        <View style={styles.middle}>
          <Text
            style={textStyle('label', {
              textDecorationLine: status === 'cancelled' ? 'line-through' : 'none',
            })}
          >
            {subscription.name}
          </Text>
          <Text style={textStyle('bodySmall', { color: subtitleColor(subscription, days, today), marginTop: spacing.xxs / 2 })}>
            {`${BILLING_CYCLE_LABELS[subscription.billingCycle]} · ${stateLabel(subscription, days, today)}`}
          </Text>
        </View>

        <Trailing subscription={subscription} today={today} days={days} showStatus={showStatus} />
      </View>
    </Pressable>
  );
});

/** Alt metindeki durum parçası: "3 gün sonra", "2 gün gecikti", "Duraklatıldı" gibi. */
function stateLabel(subscription: Subscription, days: number | null, today: CivilDate): string {
  const status = subscription.status;
  if (status === 'paused') return 'Duraklatıldı';
  if (status === 'cancelled') return 'İptal edildi';
  if (status === 'expired') return 'Süresi doldu';
  if (isNotStarted(subscription, today)) return 'Henüz başlamadı';
  if (days === null) return '—';
  if (days < 0) return `${-days} gün gecikti`;
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  return renewalLabel(days);
}

function subtitleColor(subscription: Subscription, days: number | null, today: CivilDate): string {
  if (subscription.status === 'active' && days !== null && days < 0 && !isNotStarted(subscription, today)) return colors.error;
  return colors.onSurfaceVariant;
}

function Trailing({ subscription, today, days, showStatus }: { subscription: Subscription; today: CivilDate; days: number | null; showStatus: boolean }) {
  useThemeRevision();
  const status = subscription.status;
  const muted = status === 'cancelled' || status === 'paused' || status === 'expired';
  return (
    <View style={styles.trailing}>
      <Text style={textStyle('heading', { color: muted ? colors.onSurfaceVariant : colors.onSurface, fontVariant: ['tabular-nums'] })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
      {showStatus ? (
        <View style={styles.chipGap}>
          <SubscriptionStatusChip status={status} isNotStarted={isNotStarted(subscription, today)} daysUntilRenewal={days} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 76,
    justifyContent: 'center',
    borderLeftWidth: borderWidth.hairline,
    borderRightWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  single: { borderRadius: radius.lg, borderWidth: borderWidth.hairline },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: borderWidth.hairline, borderBottomWidth: borderWidth.hairline },
  middleRow: { borderBottomWidth: borderWidth.hairline },
  last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, borderBottomWidth: borderWidth.hairline },
  pressed: {
    opacity: 0.85,
  },
  selected: { backgroundColor: withAlpha(colors.primary, 0.14) },
  check: { width: 24, height: 24, marginRight: spacing.sm, borderRadius: radius.pill, borderWidth: borderWidth.focused, borderColor: colors.controlBorder, alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderColor: colors.primary, backgroundColor: colors.primary },
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
    marginTop: spacing.xxs,
  },
  trailing: {
    alignItems: 'flex-end',
    maxWidth: '48%',
    minWidth: 88,
    flexShrink: 1,
  },
}));
