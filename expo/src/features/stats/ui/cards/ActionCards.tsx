import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { GroupedList, ListRow } from '../../../../shared/widgets/GroupedList';

/** Tasarruf analizi ve ödeme geçmişine iki satırlık gruplu kısayol listesi. */
export function ActionCards({ onSavings, onPaymentHistory }: { onSavings: () => void; onPaymentHistory: () => void }) {
  useThemeRevision();
  return (
    <GroupedList>
      <ListRow label="Tasarruf analizi" value="Fırsatları gör" onPress={onSavings} />
      <ListRow label="Ödeme geçmişi" value="Kayıtları yönet" onPress={onPaymentHistory} />
    </GroupedList>
  );
}
