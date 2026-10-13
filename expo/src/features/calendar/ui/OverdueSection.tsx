import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatCurrency } from '../../../core/format/money';
import { type CivilDate, daysBetween } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';
import { useConfirmedRenew } from '../../subscriptions/ui/useConfirmedRenew';

/** Seçili günden bağımsız "Gecikmiş" bölümü: vadesi geçmiş aktif abonelikler, satır içi onaylı "Ödendi". */
export function OverdueSection({
  subscriptions,
  today,
  onOpen,
}: {
  subscriptions: readonly Subscription[];
  today: CivilDate;
  onOpen: (subscription: Subscription) => void;
}) {
  useThemeRevision();
  const { confirm, pendingId } = useConfirmedRenew(today);
  if (subscriptions.length === 0) return null;
  return (
    <View style={styles.section} accessibilityLabel="Geciken ödemeler">
      <View style={styles.header}>
        <MaterialIcons name="error" size={sizes.calendarDot + 6} color={colors.error} />
        <Text style={textStyle('label', { color: colors.error })}>{`Geciken ödemeler (${subscriptions.length})`}</Text>
      </View>
      {subscriptions.map((subscription) => {
        const date = subscription.nextRenewalDate as CivilDate;
        const days = Math.max(0, daysBetween(date, today));
        return (
          <View key={subscription.id} style={styles.row}>
            <View style={styles.main}>
              <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.calendarAvatar} />
              <View style={styles.texts}>
                <Text style={textStyle('label')} numberOfLines={1} onPress={() => onOpen(subscription)} accessibilityRole="link">{subscription.name}</Text>
                <Text style={textStyle('bodySmall', { color: colors.error })}>{`${days > 0 ? `${days} gün gecikti` : 'Bugün yenileniyor'} · ${formatCurrency(subscription.amount, subscription.currency)}`}</Text>
              </View>
              </View>
            <TonalButton label={pendingId === subscription.id ? 'Kaydediliyor…' : 'Ödendi'} disabled={pendingId === subscription.id} onPress={() => confirm(subscription)} />
          </View>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xxs,
    padding: gaps.cardInset,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  texts: { flex: 1, marginHorizontal: spacing.md },
}));
