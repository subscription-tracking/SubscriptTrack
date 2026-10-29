import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { formatAmount, formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, radius, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { GroupedList, ListRow } from '../../../../shared/widgets/GroupedList';
import { usePermissionQuery } from '../../../notifications/data/notificationPermission';
import { type PaymentEvent } from '../../../stats/domain/paymentEvents';
import { annualEquivalent, BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription } from '../../domain/subscription';
import { enabledRuleDays, reminderSummary, totalPaid } from './detailFormat';

/** İki sütunlu özet kutuları: yıllık maliyet ve şimdiye kadar ödenen toplam. */
export function SummaryBoxes({ subscription, payments }: { subscription: Subscription; payments?: readonly PaymentEvent[] }) {
  useThemeRevision();
  const paid = payments ? totalPaid(payments, subscription.currency) : null;
  const { width, fontScale } = useWindowDimensions();
  return (
    <View style={[styles.boxes, (width < 360 || fontScale > 1.2) && styles.stacked]}>
      <Box title="Tahmini yıllık maliyet" value={formatCurrency(annualEquivalent(subscription), subscription.currency)} />
      <Box title="Toplam ödenen" value={paid ? formatAmount(paid.amount, subscription.currency) : '—'} />
    </View>
  );
}

function Box({ title, value }: { title: string; value: string }) {
  useThemeRevision();
  return (
    <View style={styles.box} accessible accessibilityLabel={`${title}: ${value}`}>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{title}</Text>
      <Text style={textStyle('heading')}>{value}</Text>
    </View>
  );
}

/** Ayrıntılar: sıklık, kategori, ödeme yöntemi ve hatırlatma; son ikisine dokununca düzenleme açılır. */
export function DetailInfoList({ subscription, onEdit }: { subscription: Subscription; onEdit: () => void }) {
  useThemeRevision();
  const permission = usePermissionQuery().data;
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const method = subscription.paymentMethod?.trim();
  const paymentMethod = method?.toLocaleLowerCase('tr-TR') === 'kart' ? 'Kart' : method || 'Belirtilmedi';
  const blocked = (permission === 'denied' || permission === 'undetermined') && enabledRuleDays(subscription.notificationRules).length > 0;
  return (
    <View style={styles.info}>
      <GroupedList>
        <ListRow stacked={stacked} icon="repeat" label="Sıklık" value={BILLING_CYCLE_LABELS[subscription.billingCycle]} />
        <ListRow stacked={stacked} icon="category" label="Kategori" value={CATEGORY_LABELS[subscription.category]} />
        <ListRow stacked={stacked} icon="credit-card" label="Ödeme yöntemi" value={paymentMethod} onPress={onEdit} />
        <ListRow stacked={stacked} icon="notifications-none" label="Hatırlatma" value={reminderSummary(subscription.notificationRules)} onPress={onEdit} />
      </GroupedList>
      {blocked ? (
        <Text style={textStyle('caption', { color: colors.error })}>
          Bildirim izni verilmediği için bu hatırlatmalar gelmeyecek. Ayarlar › Bildirimler&apos;den izin ver.
        </Text>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  boxes: { flexDirection: 'row', gap: spacing.sm },
  stacked: { flexDirection: 'column' },
  box: {
    flex: 1,
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  info: { gap: spacing.xs },
}));
