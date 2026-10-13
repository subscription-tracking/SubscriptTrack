import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { Pressable, Text, View } from 'react-native';
import { LockAwareModal } from '../../../shared/widgets/LockAwareModal';
import { colors, gaps } from '../../../shared/design/tokens';
import { codeText, textStyle } from '../../../shared/design/typography';
import { styles } from './csvImportStyles';

const CSV_EXAMPLE =
  'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after\n' +
  'Netflix,149.99,TRY,monthly,2026-10-16,streaming,active,,,,';

export function CsvExampleDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  useThemeRevision();
  return (
      <LockAwareModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" style={styles.backdrop} onPress={onClose}>
          <View style={styles.dialog}>
            <Text style={textStyle('title')}>Örnek CSV formatı</Text>
            <Text style={textStyle('bodySmall', { marginTop: gaps.rowLoose - 2 })}>
              Gerekli sütunlar: name, amount, currency, billing_cycle, next_renewal_date (YYYY-AA-GG), category. Diğer sütunlar dışa aktarılan dosyadaki isteğe bağlı alanlardır.
            </Text>
            <View style={styles.codeBox}>
              <Text selectable style={codeText}>
                {CSV_EXAMPLE}
              </Text>
            </View>
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.dialogButton}>
                <Text style={textStyle('bodyStrong', { color: colors.onPrimary })}>Kapat</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </LockAwareModal>
  );
}
