import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { deviceTimeZone, zoneToday, type CivilDate } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { importSubscriptionRows, type ImportOutcome } from '../data/csvImport';
import { subscriptionKeys } from '../data/queries';
import { CSV_TEMPLATE, parseSubscriptionCsv, type ParseResult, MAX_IMPORT_ROWS } from '../domain/csvImportParser';

const SHOW_ERRORS = 8;

/** CSV içe aktarma: dosyayı seç, önizle, geçerli satırları oluştur. İçe aktarma çevrimiçi yapılır. */
export function CsvImportScreen() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  async function pick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const text = await new File(asset.uri).text();
      setFileName(asset.name);
      setOutcome(null);
      setParsed(parseSubscriptionCsv(text));
    } catch {
      snackbar.show('Dosya okunamadı. Farklı bir dosya dene.', 'error');
    }
  }

  async function runImport() {
    if (!user || !parsed || parsed.rows.length === 0) return;
    if (!online) {
      snackbar.show('İçe aktarma için internet bağlantısı gerekir.', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await importSubscriptionRows(user.id, parsed.rows, today, (done, total) => setProgress({ done, total }));
      setOutcome(result);
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      snackbar.show(`${result.created} abonelik eklendi.`, result.failures.length ? 'default' : 'primary');
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'İçe aktarılamadı.', 'error');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="CSV içe aktar" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={textStyle('titleSmall')}>Dosya biçimi</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            Zorunlu sütunlar: name, amount, currency, billing_cycle, next_renewal_date, category. En fazla {MAX_IMPORT_ROWS} satır.
            Tarih YYYY-AA-GG biçiminde olmalı.
          </Text>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{CSV_TEMPLATE}</Text>
        </View>

        <Spacer size={spacing.md} />
        <OutlinedButton label={fileName ? 'Başka dosya seç' : 'Dosya seç'} onPress={() => void pick()} />

        {parsed ? (
          <>
            <Spacer size={spacing.md} />
            <View style={styles.card}>
              <Text style={textStyle('titleSmall')}>{fileName}</Text>
              <Text style={textStyle('bodySmall')}>
                {parsed.rows.length} satır içe aktarılabilir · {parsed.errors.length} satır atlanacak
              </Text>
              {parsed.errors.slice(0, SHOW_ERRORS).map((line) => (
                <Text key={line} style={textStyle('caption', { color: colors.error })}>
                  {line}
                </Text>
              ))}
              {parsed.errors.length > SHOW_ERRORS ? (
                <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
                  ve {parsed.errors.length - SHOW_ERRORS} hata daha
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {parsed && parsed.rows.length > 0 ? (
          <>
            <Spacer size={spacing.md} />
            {!online ? <Text style={textStyle('caption', { color: colors.error })}>İçe aktarma için internet bağlantısı gerekir.</Text> : null}
            <PrimaryButton
              label={busy && progress ? `Ekleniyor ${progress.done}/${progress.total}` : `${parsed.rows.length} aboneliği içe aktar`}
              onPress={() => void runImport()}
              loading={busy}
              disabled={!online || busy}
            />
          </>
        ) : null}

        {outcome ? (
          <>
            <Spacer size={spacing.md} />
            <View style={styles.card}>
              <Text style={textStyle('titleSmall')}>Sonuç</Text>
              <Text style={textStyle('bodySmall')}>{outcome.created} abonelik eklendi.</Text>
              {outcome.failures.map((failure) => (
                <Text key={`${failure.line}-${failure.name}`} style={textStyle('caption', { color: colors.error })}>
                  Satır {failure.line} ({failure.name}): {failure.message}
                </Text>
              ))}
              {outcome.warnings.map((warning) => (
                <Text key={warning} style={textStyle('caption', { color: colors.onSurfaceVariant })}>
                  {warning}
                </Text>
              ))}
            </View>
          </>
        ) : null}
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xs,
  },
});
