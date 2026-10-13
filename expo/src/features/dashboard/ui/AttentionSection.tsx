import { Alert, StyleSheet, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, gaps } from '../../../shared/design/tokens';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TextLink } from '../../../shared/widgets/TextLink';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { advancedRenewalDate } from '../../subscriptions/domain/renewalOverdue';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { useRenewAction } from '../../subscriptions/ui/useRenewAction';
import { type AttentionItem } from '../domain/homeSummary';
import { SectionHeader } from './SectionHeader';
import { SubscriptionRowCard } from './SubscriptionRowCard';

const MAX_ROWS = 3;

/** Satırın alt metni: gecikmişse "N gün gecikti · tutar", bugünse "Bugün yenileniyor · tutar". */
export function attentionSubtitle(item: AttentionItem): string {
  const amount = formatCurrency(item.subscription.amount, item.subscription.currency);
  return item.daysOverdue > 0 ? `${item.daysOverdue} gün gecikti · ${amount}` : `Bugün yenileniyor · ${amount}`;
}

/** "Dikkat gerektirenler": vadesi gelmiş kayıtlar, satır içi "Ödendi" onayıyla. Kayıt yoksa hiçbir şey çizmez. */
export function AttentionSection({
  items,
  today,
  onOpen,
  onMore,
}: {
  items: readonly AttentionItem[];
  today: CivilDate;
  onOpen: (id: string) => void;
  onMore: () => void;
}) {
  useThemeRevision();
  const renew = useRenewAction();
  if (items.length === 0) return null;
  const pendingId = renew.isPending ? renew.variables?.id : undefined;

  const confirm = (subscription: Subscription) => {
    const next = advancedRenewalDate(subscription, today);
    Alert.alert(
      `${subscription.name} ödendi mi?`,
      next ? `Yenileme tarihi ${formatLongDate(next)} olacak.` : 'Yenileme tarihi güncellenecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ödendi', onPress: () => renew.mutate(subscription) },
      ],
    );
  };

  return (
    <View>
      <SectionHeader title="Dikkat gerektirenler" badge={items.length} />
      <View style={styles.list}>
        {items.slice(0, MAX_ROWS).map((item) => (
          <SubscriptionRowCard
            key={item.subscription.id}
            subscription={item.subscription}
            subtitle={attentionSubtitle(item)}
            subtitleColor={colors.error}
            onPress={() => onOpen(item.subscription.id)}
            trailing={
              <TonalButton
                label="Ödendi"
                disabled={pendingId === item.subscription.id}
                onPress={() => confirm(item.subscription)}
              />
            }
          />
        ))}
      </View>
      {items.length > MAX_ROWS ? <TextLink label={`+${items.length - MAX_ROWS} daha`} onPress={onMore} /> : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  list: { marginTop: gaps.sectionInner, gap: gaps.trialCard },
}));
