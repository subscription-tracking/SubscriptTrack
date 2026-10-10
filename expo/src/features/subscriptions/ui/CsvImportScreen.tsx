import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { deviceTimeZone, zoneToday, type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { codeText, textButtonText, textStyle } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { importSubscriptionRows } from '../data/csvImport';
import { subscriptionKeys } from '../data/queries';
import { parseSubscriptionCsv, type ParseResult } from '../domain/csvImportParser';
import { BILLING_CYCLE_LABELS } from '../domain/subscription';

/** Flutter `_csvTemplate`: parser'ın gerçekte beklediği başlıklar. Dışa aktarma dosyasının başlıkları değildir. */
const CSV_EXAMPLE =
  'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after\n' +
  'Netflix,149.99,TRY,monthly,2026-10-16,streaming,active,,,,';

/**
 * CSV içe aktarma (Flutter `CsvImportScreen`): dosya seç, örnek formatı gör, geçerli satırları listele,
 * içe aktar. İçe aktarma çevrimiçi yapılır; bitince bir önceki ekrana dönülür.
 */
export function CsvImportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);

  async function pick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;
      const text = await new File(result.assets[0].uri).text();
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
      const outcome = await importSubscriptionRows(user.id, parsed.rows, today, () => undefined);
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      snackbar.show(`${outcome.created} abonelik içe aktarıldı.`, 'primary');
      router.back();
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'İçe aktarılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="CSV içe aktar" />
      <View style={styles.body}>
        {parsed === null ? (
          <View style={styles.start}>
            <PrimaryButton label="CSV dosyası seç" icon="upload-file" tall={false} onPress={() => void pick()} />
            <View style={styles.gapSmall} />
            <Pressable accessibilityRole="button" onPress={() => setExampleOpen(true)} style={styles.textButton}>
              <MaterialIcons name="description" size={sizes.linkIcon} color={colors.primary} />
              <Text style={[textButtonText, styles.textButtonLabel]}>Örnek format nasıl olmalı?</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <Text style={textStyle('titleSmall')}>{`${parsed.rows.length} geçerli kayıt`}</Text>
            {parsed.errors.length > 0 ? (
              <View style={styles.errors}>
                <Text style={textStyle('bodySmall', { color: colors.error })}>{`${parsed.errors.length} satır aktarılmadı`}</Text>
                {parsed.errors.map((line) => (
                  <Text key={line} style={textStyle('caption')}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.gapRows} />
            {parsed.rows.map((row, index) => (
              <View key={`${index}-${row.name}`} style={styles.row}>
                <Text style={textStyle('body')}>{row.name}</Text>
                <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
                  {`${row.amount.amount} ${row.currency} · ${BILLING_CYCLE_LABELS[row.billingCycle]}`}
                </Text>
              </View>
            ))}
            <View style={styles.gapRows} />
            <PrimaryButton
              label={busy ? 'İçe aktarılıyor...' : 'Geçerli kayıtları içe aktar'}
              tall={false}
              loading={busy}
              disabled={!online || busy || parsed.rows.length === 0}
              onPress={() => void runImport()}
            />
            {!online ? (
              <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xs })}>İçe aktarma için internet bağlantısı gerekir.</Text>
            ) : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void pick()} style={styles.textButton}>
              <Text style={[textButtonText, styles.textButtonLabel]}>Başka dosya seç</Text>
            </Pressable>
            <ScreenBottomInset />
          </ScrollView>
        )}
      </View>

      <Modal visible={exampleOpen} transparent animationType="fade" onRequestClose={() => setExampleOpen(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" style={styles.backdrop} onPress={() => setExampleOpen(false)}>
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
              <Pressable accessibilityRole="button" onPress={() => setExampleOpen(false)} style={styles.dialogButton}>
                <Text style={textStyle('button', { color: colors.onPrimary })}>Kapat</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  start: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapSmall: {
    height: gaps.rowLoose - 2,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  textButtonLabel: {
    marginLeft: spacing.xs,
  },
  list: {
  },
  errors: {
    marginTop: gaps.rowLoose - 2,
    gap: spacing.xxs,
  },
  gapRows: {
    height: gaps.cardInset,
  },
  row: {
    paddingVertical: spacing.xs,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: withAlpha(colors.scrim, 0.54),
  },
  dialog: {
    padding: spacing.lg,
    borderRadius: radius.sheet,
    backgroundColor: colors.surfaceHigh,
    gap: spacing.xs,
  },
  codeBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.field - 4,
    backgroundColor: colors.surfaceContainerHighest,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  dialogButton: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
