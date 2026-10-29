import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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
  loading = false,
  error = false,
  onRetry,
}: {
  payments?: readonly PaymentEvent[];
  timeZone: string;
  onSeeAll: () => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  useThemeRevision();
  const recent = payments ? [...payments].sort((a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt) || a.id.localeCompare(b.id)).slice(0, RECENT_LIMIT) : [];
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <View style={styles.section}>
      <View style={[styles.header, stacked && styles.stackedHeader]}>
        <Text accessibilityRole="header" style={textStyle('heading')}>Son ödemeler</Text>
        {recent.length > 0 ? <TextLink label="Tümünü gör" onPress={onSeeAll} /> : null}
      </View>
      {loading && !payments ? (
        <Text accessibilityLiveRegion="polite" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Ödemeler yükleniyor…</Text>
      ) : error ? (
        <View style={styles.card}>
          <Text style={[textStyle('bodySmall', { color: colors.onSurfaceVariant }), styles.message]}>Ödeme geçmişi güncellenemedi.{payments ? ' Son kayıtlar gösteriliyor.' : ''}</Text>
          {onRetry ? <TextLink label="Ödemeleri tekrar yükle" onPress={onRetry} /> : null}
        </View>
      ) : null}
      {!payments ? null : recent.length === 0 ? (
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Henüz ödeme kaydı yok.</Text>
      ) : (
        <>
          <View style={styles.card}>
            {recent.map((event, index) => (
              <View key={event.id} style={[styles.row, stacked && styles.stackedRow, index > 0 && styles.divider]}>
                <Text style={[textStyle('bodySmall'), styles.date]}>{formatLongDate(localCivilDate(event.paidAt, timeZone))}</Text>
                <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{paymentStatusLabel(event.status)}</Text>
                <Text style={textStyle('bodyStrong')}>{formatAmount(event.amount.amount, event.currency)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  stackedHeader: { alignItems: 'flex-start', flexDirection: 'column' },
  stackedRow: { alignItems: 'flex-start', flexDirection: 'column' },
  message: { padding: spacing.md },
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
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  divider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  date: { flex: 1 },
}));
