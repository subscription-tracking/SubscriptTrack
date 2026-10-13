import { StyleSheet, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { type CivilDate } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, gaps } from '../../../shared/design/tokens';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TextLink } from '../../../shared/widgets/TextLink';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { useConfirmedRenew } from '../../subscriptions/ui/useConfirmedRenew';
import { type AttentionItem } from '../domain/homeSummary';
import { SectionHeader } from './SectionHeader';
import { SubscriptionRowCard } from './SubscriptionRowCard';

const MAX_ROWS = 3;

/** Satırın alt metni: gecikmişse "N gün gecikti · tutar", bugünse "Bugün yenileniyor · tutar". */
export function attentionSubtitle(item: AttentionItem): string {
  const amount = formatCurrency(item.subscription.amount, item.subscription.currency);
  return item.daysOverdue > 0 ? `${item.daysOverdue} gün gecikti · ${amount}` : `Bugün yenileniyor · ${amount}`;
}

/** "Geciken ödemeler": vadesi gelmiş kayıtlar, satır içi "Ödendi" onayıyla. Kayıt yoksa hiçbir şey çizmez. */
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
  const { confirm, pendingId } = useConfirmedRenew(today);
  if (items.length === 0) return null;

  return (
    <View>
      <SectionHeader title="Geciken ödemeler" badge={items.length} />
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
