import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { Text, View } from 'react-native';

import { colors, spacing } from '../../../shared/design/tokens';
import { codeText, textStyle } from '../../../shared/design/typography';
import { styles } from './csvImportStyles';

const STEPS = ['Dosyanı seç', 'Önizlemeyi kontrol et', 'İçe aktar'];

const SAMPLE_ROWS = 'name,amount,currency,billing_cycle,next_renewal_date,category\nNetflix,149.99,TRY,monthly,2026-10-16,streaming';

/** Boş durumun üstünde: 3 adımlık açıklama ve kısa örnek satır. */
export function CsvImportSteps() {
  useThemeRevision();
  return (
    <View style={styles.steps}>
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
        Daha önce dışa aktardığın ya da kendin hazırladığın bir CSV dosyasından abonelikleri toplu ekleyebilirsin.
      </Text>
      {STEPS.map((step, index) => (
        <View key={step} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={textStyle('captionStrong', { color: colors.onPrimaryContainer })}>{index + 1}</Text>
          </View>
          <Text style={textStyle('body', { marginLeft: spacing.sm, flex: 1 })}>{step}</Text>
        </View>
      ))}
      <View style={styles.codeBox}>
        <Text selectable style={codeText}>
          {SAMPLE_ROWS}
        </Text>
      </View>
    </View>
  );
}
