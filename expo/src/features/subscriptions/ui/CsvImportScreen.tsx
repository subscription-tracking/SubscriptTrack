import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, sizes } from '../../../shared/design/tokens';
import { textButtonText } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useCsvImportController } from './useCsvImportController';
import { CsvImportPreview } from './CsvImportPreview';
import { CsvExampleDialog } from './CsvExampleDialog';
import { CsvImportSteps } from './CsvImportSteps';
import { styles } from './csvImportStyles';

export function CsvImportScreen() {
  useThemeRevision();
  const { parsed, busy, online, pick, runImport } = useCsvImportController();
  const [exampleOpen, setExampleOpen] = useState(false);
  return (
    <View style={styles.screen}>
      <ScreenTopBar title="CSV içe aktar" />
      <View style={styles.body}>
        {parsed === null ? (
          <ScrollView contentContainerStyle={styles.start}>
            <CsvImportSteps />
            <PrimaryButton label="CSV dosyası seç" icon="upload-file" tall={false} onPress={() => void pick()} />
            <View style={styles.gapSmall} />
            <Pressable accessibilityRole="button" onPress={() => setExampleOpen(true)} style={styles.textButton}>
              <MaterialIcons name="description" size={sizes.linkIcon} color={colors.primary} />
              <Text style={[textButtonText, styles.textButtonLabel]}>Örnek format nasıl olmalı?</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <CsvImportPreview parsed={parsed} busy={busy} online={online} onPick={pick} onImport={runImport} />
        )}
      </View>

      <CsvExampleDialog visible={exampleOpen} onClose={() => setExampleOpen(false)} />
    </View>
  );
}
