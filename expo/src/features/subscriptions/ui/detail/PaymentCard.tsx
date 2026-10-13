import { StyleSheet, Text, View } from 'react-native';

import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { formatLongDate } from '../../../../core/format/date';
import { type CivilDate } from '../../../../core/time/calendar';
import { borderWidth, colors, radius, spacing, statusColors, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { PrimaryButton } from '../../../../shared/widgets/PrimaryButton';
import { daysUntilRenewal, type Subscription } from '../../domain/subscription';
import { advancedRenewalDate, isRenewalDue } from '../../domain/renewalOverdue';
import { isNotStarted } from '../../domain/activeSelectors';

const STATUS_NOTES: Partial<Record<Subscription['status'], string>> = {
  paused: 'Bu abonelik duraklatıldı. Devam edene kadar ödeme beklenmez.',
  cancelled: 'Bu abonelik iptal edildi. Yeni ödeme beklenmez.',
  archived: 'Bu abonelik arşivlendi. Takipten çıkarıldığı için ödeme beklenmez.',
  expired: 'Bu aboneliğin süresi doldu. Yeniden etkinleştirirsen takip sürer.',
};

function countdown(days: number): string {
  if (days === 0) return 'Bugün';
  return days < 0 ? `${-days} gün gecikti` : `${days} gün kaldı`;
}

/**
 * Ödeme kartı: sonraki ödeme tarihi, geri sayım çipi ve vadesi gelmişse "Ödendi ve yenilendi".
 * Duraklatılmış, iptal edilmiş ve arşivlenmiş kayıtlarda tarih yerine durum açıklaması gösterilir.
 */
export function PaymentCard({
  subscription,
  today,
  busy,
  onRenew,
}: {
  subscription: Subscription;
  today: CivilDate;
  busy: boolean;
  onRenew: () => void;
}) {
  useThemeRevision();
  const note = STATUS_NOTES[subscription.status];
  if (note) {
    return (
      <View style={styles.card}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{note}</Text>
      </View>
    );
  }
  const days = daysUntilRenewal(subscription, today);
  if (days === null || !subscription.nextRenewalDate) return null;
  const tone = days < 0 ? colors.error : days <= 3 ? colors.tertiary : days <= 7 ? statusColors.warning : colors.primary;
  const due = isRenewalDue(subscription, today);
  const showRenew = subscription.status === 'active' && due;
  const advanced = advancedRenewalDate(subscription, today);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Sonraki ödeme</Text>
          <Text style={textStyle('heading')}>{formatLongDate(subscription.nextRenewalDate)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: withAlpha(tone, 0.12), borderColor: withAlpha(tone, 0.3) }]}>
          <Text style={textStyle('captionStrong', { color: tone })}>{countdown(days)}</Text>
        </View>
      </View>
      {days < 0 && advanced ? (
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{`Sonraki döngü (tahmini): ${formatLongDate(advanced)}`}</Text>
      ) : null}
      {isNotStarted(subscription, today) ? <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Henüz başlamadı</Text> : null}
      {showRenew ? (
        <View style={styles.renew}>
          <PrimaryButton label="Ödendi ve yenilendi" icon="check-circle-outline" disabled={busy} onPress={onRenew} />
          {advanced ? (
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
              {`Ödemeyi işaretleyince sonraki tarih ${formatLongDate(advanced)} olur.`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1 },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
  },
  renew: { gap: spacing.xs, marginTop: spacing.xs },
}));
