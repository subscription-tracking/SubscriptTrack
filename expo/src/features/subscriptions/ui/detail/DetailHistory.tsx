import { StyleSheet, Text, View } from 'react-native';

import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { formatAmount } from '../../../../core/format/money';
import { formatLongDate } from '../../../../core/format/date';
import { borderWidth, colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { TextLink } from '../../../../shared/widgets/TextLink';
import { localCivilDate, type PaymentEvent } from '../../../stats/domain/paymentEvents';
import { paymentStatusLabel } from '../../../stats/domain/paymentStatusLabel';

const RECENT_LIMIT = 3;

/** Son ödemeler: en çok üç satır; "Tümünü gör" ödeme geçmişi sayfasını açar. */
export function RecentPayments({
  payments,
  timeZone,
  onSeeAll,
}: {
  payments: readonly PaymentEvent[];
  timeZone: string;
  onSeeAll: () => void;
}) {
  useThemeRevision();
  const recent = payments.slice(0, RECENT_LIMIT);
  return (
    <View style={styles.section}>
      <Text style={textStyle('heading')}>Son ödemeler</Text>
      {recent.length === 0 ? (
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Henüz ödeme kaydı yok.</Text>
      ) : (
        <>
          <View style={styles.card}>
            {recent.map((event, index) => (
              <View key={event.id} style={[styles.row, index > 0 && styles.divider]}>
                <Text style={[textStyle('bodySmall'), styles.date]}>{formatLongDate(localCivilDate(event.paidAt, timeZone))}</Text>
                <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{paymentStatusLabel(event.status)}</Text>
                <Text style={textStyle('bodyStrong')}>{formatAmount(event.amount.amount, event.currency)}</Text>
              </View>
            ))}
          </View>
          <TextLink label="Tümünü gör" onPress={onSeeAll} align="end" />
        </>
      )}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: { gap: spacing.xs },
  card: {
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  divider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  date: { flex: 1 },
}));
