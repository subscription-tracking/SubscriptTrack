import { type Href, useRouter } from 'expo-router';
import { spacing } from '../../../shared/design/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { Money } from '../../../core/domain/money';
import { zoneToday, type CivilDate } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextLink } from '../../../shared/widgets/TextLink';
import { useSubscriptionQuery } from '../data/queries';
import { OVERDUE_LABEL, isOverdueRenewal } from '../domain/renewalOverdue';
import { SubscriptionStatusActions } from './SubscriptionStatusActions';
import { renewalLabel } from '../domain/renewalLabel';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, STATUS_LABELS, type Subscription, daysUntilRenewal, monthlyEquivalent } from '../domain/subscription';

/**
 * Abonelik detayı: bilgiler, durum aksiyonları (durdur, iptal, arşivle) ve düzenleme girişi.
 * Kayıt bulunamazsa "artık mevcut değil" gösterilir.
 */
export function SubscriptionDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionQuery(user?.id, id);

  const state: AsyncState<Subscription> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Abonelik yüklenemedi. Tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : query.data
        ? { status: 'ready', data: query.data }
        : {
            status: 'empty',
            title: 'Bu abonelik artık mevcut değil',
            description: 'Aboneliği silinmiş ya da erişilemez olabilir.',
            action: <TextLink label="Listeye dön" onPress={() => router.back()} />,
          };

  return (
    <View style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <AsyncStateView state={state}>
        {(subscription) => (
          <Details
            subscription={subscription}
            onEdit={() => router.push(`/subscriptions/${subscription.id}/edit` as Href)}
            onCancel={() => router.push(`/subscriptions/${subscription.id}/cancel` as Href)}
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function Details({ subscription, onEdit, onCancel }: { subscription: Subscription; onEdit: () => void; onCancel: () => void }) {
  const today: CivilDate = zoneToday(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const days = daysUntilRenewal(subscription, today);
  const monthly = monthlyEquivalent(subscription);
  const yearly = monthly.multiply(12);
  const endedStatus = subscription.status === 'cancelled' || subscription.status === 'expired' || subscription.status === 'archived';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={textStyle('title', { color: colors.primary })}>
            {subscription.name.charAt(0).toLocaleUpperCase('tr-TR')}
          </Text>
        </View>
        <Text style={textStyle('title', { textAlign: 'center' })}>{subscription.name}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>
          {CATEGORY_LABELS[subscription.category]} · {BILLING_CYCLE_LABELS[subscription.billingCycle]}
        </Text>
        <StatusPill label={STATUS_LABELS[subscription.status]} muted={endedStatus || subscription.status === 'paused'} />
      </View>

      <Spacer size={spacing.xl} />

      <SubscriptionStatusActions subscription={subscription} onEdit={onEdit} onCancel={onCancel} />

      <Spacer size={spacing.md} />

      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Tutar</Text>
        <Text style={textStyle('title')}>
          {formatCurrency(subscription.amount, subscription.currency)}
        </Text>
        <Spacer size={spacing.sm} />
        <View style={styles.equivalents}>
          <Equivalent label="Aylık eşdeğer" value={monthly} currency={subscription.currency} />
          <Equivalent label="Yıllık eşdeğer" value={yearly} currency={subscription.currency} />
        </View>
      </View>

      <Spacer size={spacing.md} />

      <View style={styles.card}>
        <InfoRow
          label="Sonraki yenileme"
          value={subscription.nextRenewalDate ? formatLongDate(subscription.nextRenewalDate) : '—'}
          hint={
            isOverdueRenewal(subscription, today)
              ? OVERDUE_LABEL
              : days !== null && !endedStatus
                ? renewalLabel(days)
                : undefined
          }
        />
        <InfoRow label="Başlangıç" value={subscription.startDate ? formatLongDate(subscription.startDate) : '—'} />
        {subscription.trialEndDate ? (
          <InfoRow label="Deneme bitişi" value={formatLongDate(subscription.trialEndDate)} />
        ) : null}
        {subscription.trialPriceAfter ? (
          <InfoRow
            label="Deneme sonrası tutar"
            value={formatCurrency(subscription.trialPriceAfter, subscription.currency)}
          />
        ) : null}
        {subscription.paymentMethod ? <InfoRow label="Ödeme yöntemi" value={subscription.paymentMethod} /> : null}
        {subscription.website ? <InfoRow label="Web sitesi" value={subscription.website} last={!subscription.notes} /> : null}
        {subscription.notes ? <InfoRow label="Not" value={subscription.notes} last /> : null}
      </View>

      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
      </Pressable>
    </View>
  );
}

function StatusPill({ label, muted }: { label: string; muted: boolean }) {
  return (
    <View style={[styles.pill, muted && styles.pillMuted]}>
      <Text style={textStyle('caption', { color: muted ? statusColors.muted : colors.primary })}>{label}</Text>
    </View>
  );
}

function Equivalent({ label, value, currency }: { label: string; value: Money; currency: string }) {
  return (
    <View style={styles.equivalent}>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{label}</Text>
      <Text style={textStyle('titleSmall')}>{formatCurrency(value, currency)}</Text>
    </View>
  );
}

function InfoRow({ label, value, hint, last = false }: { label: string; value: string; hint?: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{label}</Text>
      <Text style={textStyle('titleSmall', { textAlign: 'right', flexShrink: 1 })}>{value}</Text>
      {hint ? <Text style={textStyle('caption', { color: colors.primary })}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  topBar: {
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
    justifyContent: 'center',
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: sizes.avatarLarge / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    marginBottom: spacing.xs,
  },
  pill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
  },
  pillMuted: {
    backgroundColor: colors.surface,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xxs,
  },
  equivalents: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  equivalent: {
    gap: spacing.xxs,
  },
  infoRow: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
});
