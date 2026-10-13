import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LockAwareModal } from '../../../../shared/widgets/LockAwareModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatAmount } from '../../../../core/format/money';
import { formatLongDate } from '../../../../core/format/date';
import { borderWidth, colors, radius, sizes, spacing, statusColors, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { localCivilDate, type PaymentEvent } from '../../../stats/domain/paymentEvents';
import { paymentStatusLabel } from '../../../stats/domain/paymentStatusLabel';
import { Card, Section } from './DetailSections';

/** Flutter `DetailPaymentHistorySection`: en son iki ödeme, "Tümünü gör" ile tüm liste. */
export function PaymentHistorySection({ payments, timeZone }: { payments: PaymentEvent[]; timeZone: string }) {
  useThemeRevision();
  const [showAll, setShowAll] = useState(false);
  const recent = payments.slice(0, 2);
  return (
    <Section
      caption="GEÇMİŞ ÖDEMELER"
      action={
        payments.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={styles.seeAll}>
            <Text style={textStyle('captionStrong', { color: colors.primary })}>Tümünü gör</Text>
          </Pressable>
        ) : null
      }
    >
      <Card padding={0}>
        {recent.length === 0 ? (
          <Text style={[textStyle('bodySmall', { color: colors.onSurfaceVariant }), styles.emptyHistory]}>Henüz ödeme geçmişi yok</Text>
        ) : (
          recent.map((event, index) => (
            <View key={event.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <HistoryRow event={event} timeZone={timeZone} />
            </View>
          ))
        )}
      </Card>
      <LockAwareModal visible={showAll} transparent animationType="fade" onRequestClose={() => setShowAll(false)}>
        <Pressable style={styles.dialogBackdrop} onPress={() => setShowAll(false)}>
          <View style={styles.dialog}>
            <Text style={textStyle('bodyStrong')}>Geçmiş ödemeler</Text>
            <ScrollView style={styles.dialogList}>
              {payments.map((event) => (
                <HistoryRow key={event.id} event={event} timeZone={timeZone} />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </LockAwareModal>
    </Section>
  );
}

function HistoryRow({ event, timeZone }: { event: PaymentEvent; timeZone: string }) {
  useThemeRevision();
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyCircle}>
        <MaterialIcons name="check" size={sizes.detailCardIcon} color={statusColors.success} />
      </View>
      <View style={styles.historyDate}>
        <Text style={textStyle('label')}>{formatLongDate(localCivilDate(event.paidAt, timeZone))}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>
          {paymentStatusLabel(event.status)}
        </Text>
      </View>
      <Text style={textStyle('label')}>{formatAmount(event.amount.amount, event.currency)}</Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  seeAll: {
    paddingHorizontal: spacing.xs,
  },
  emptyHistory: {
    padding: spacing.lg,
  },
  divider: {
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  historyCircle: {
    width: sizes.detailTileCircle,
    height: sizes.detailTileCircle,
    borderRadius: sizes.detailTileCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(statusColors.success, 0.15),
  },
  historyDate: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  dialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: withAlpha(colors.scrim, 0.54),
  },
  dialog: {
    maxHeight: '70%',
    padding: spacing.lg,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceLow,
  },
  dialogList: {
    marginTop: spacing.sm,
  },
}));
