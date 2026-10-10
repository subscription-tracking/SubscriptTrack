import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { createPinRecord, verifyPinRecord } from '../../../core/security/pinRecord';
import { borderWidth, colors, gaps, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { FilledButtonLabel } from '../../../shared/widgets/FilledButtonLabel';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useAppLock } from './appLockContext';
import { RadioRow, SwitchTile } from './SettingsControls';
import { biometricsAvailable } from '../data/biometrics';
import { readAppLock, writeBiometric, writePinRecord, writeTimeoutMinutes } from '../data/appLockStore';
import { isValidPin, PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../domain/appLockRules';

/** Flutter `_lockTimeoutOptions`: hemen, 1 ve 5 dakika. 15 dakikalık seçenek Expo'da yalnızca eski kayıtlar için kalır. */
const TIMEOUT_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'Hemen' },
  { minutes: 1, label: '1 dakika sonra' },
  { minutes: 5, label: '5 dakika sonra' },
];

/**
 * Uygulama kilidi (Flutter `AppLockSettingsScreen`): PIN anahtarı, PIN kurulumu, biyometri anahtarı ve kilit süresi.
 * Kapatma ve PIN değiştirme mevcut PIN'in doğrulanmasını ister; bu Flutter'dan daha sıkı bir güvenlik kuralıdır.
 */
export function AppLockSettingsScreen() {
  const lock = useAppLock();
  const snackbar = useSnackbar();
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    void biometricsAvailable().then(setHasBiometrics);
  }, []);

  const savePin = useMutation({
    mutationFn: async (input: { pin: string; current?: string }) => {
      if (lock.enabled) {
        const stored = await readAppLock();
        if (!stored.pinRecord || !input.current || !(await verifyPinRecord(input.current, stored.pinRecord))) {
          throw new Error('Mevcut PIN yanlış.');
        }
      }
      await writePinRecord(await createPinRecord(input.pin));
    },
    onSuccess: async () => {
      await lock.refresh();
      snackbar.show('PIN kaydedildi.', 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const disable = useMutation({
    mutationFn: async (current: string) => {
      const stored = await readAppLock();
      if (!stored.pinRecord || !(await verifyPinRecord(current, stored.pinRecord))) throw new Error('PIN yanlış.');
      await writePinRecord(null);
      await writeBiometric(false);
    },
    onSuccess: async () => {
      await lock.refresh();
      snackbar.show('Uygulama kilidi kapatıldı.', 'default');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const setTimeout = useMutation({
    mutationFn: (minutes: number) => writeTimeoutMinutes(minutes),
    onSuccess: () => lock.refresh(),
  });

  const setBiometric = useMutation({
    mutationFn: (enabled: boolean) => writeBiometric(enabled),
    onSuccess: () => lock.refresh(),
  });

  const busy = savePin.isPending || disable.isPending;

  return (
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title="Uygulama kilidi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SwitchTile
          label="PIN kilidi"
          subtitle={lock.enabled ? 'Arka plandan dönünce sorulur' : 'Kapalı'}
          value={lock.enabled}
          disabled
          onValueChange={() => undefined}
        />

        {lock.enabled ? (
          <EnabledSection
            busy={busy}
            onChangePin={(pin, current) => savePin.mutate({ pin, current })}
            onDisable={(current) => disable.mutate(current)}
          />
        ) : (
          <SetupSection busy={busy} onSetup={(pin) => savePin.mutate({ pin })} />
        )}

        <View style={styles.divider} />
        <SwitchTile
          label="Biyometrik kilit açma"
          subtitle={lock.enabled ? (hasBiometrics ? undefined : 'Bu cihazda biyometri kullanılamıyor.') : 'Önce PIN kilidini etkinleştir'}
          value={lock.biometricEnabled}
          disabled={!lock.enabled || setBiometric.isPending}
          onValueChange={(enabled) => {
            if (enabled && !hasBiometrics) {
              snackbar.show('Bu cihazda kayıtlı biyometri bulunamadı.', 'error');
              return;
            }
            setBiometric.mutate(enabled);
          }}
        />

        {lock.enabled ? (
          <>
            <View style={styles.divider} />
            <Text style={textStyle('sectionLabel', { paddingHorizontal: spacing.lg, paddingTop: spacing.md })}>Kilit süresi</Text>
            {TIMEOUT_OPTIONS.map((option) => (
              <RadioRow
                key={option.minutes}
                label={option.label}
                selected={lock.timeoutMinutes === option.minutes}
                onPress={() => setTimeout.mutate(option.minutes)}
              />
            ))}
          </>
        ) : null}
        <ScreenBottomInset />
      </ScrollView>
    </KeyboardScreen>
  );
}

/** PIN kapalıyken: yeni PIN ve "PIN'i etkinleştir" düğmesi. */
function SetupSection({ busy, onSetup }: { busy: boolean; onSetup: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!isValidPin(pin)) {
      setError(`PIN ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} rakam olmalı`);
      return;
    }
    setError(null);
    onSetup(pin);
  }

  return (
    <View style={styles.block}>
      <TextField label="Yeni PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} error={error} />
      <View style={styles.gap} />
      <FilledButtonLabel label="PIN’i etkinleştir" busy={busy} onPress={submit} />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
        PIN cihazında özetlenmiş olarak saklanır; sunucuya gönderilmez.
      </Text>
    </View>
  );
}

/** PIN açıkken: PIN değiştirme (mevcut PIN gerekir) ve kilidi kapatma (mevcut PIN gerekir). */
function EnabledSection({
  busy,
  onChangePin,
  onDisable,
}: {
  busy: boolean;
  onChangePin: (pin: string, current: string) => void;
  onDisable: (current: string) => void;
}) {
  const snackbar = useSnackbar();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function changePin() {
    if (!isValidPin(current)) return setError('Mevcut PIN’ini gir');
    if (!isValidPin(next)) return setError(`Yeni PIN ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} rakam olmalı`);
    if (next !== confirm) return setError('Yeni PIN’ler eşleşmiyor');
    setError(null);
    onChangePin(next, current);
    setCurrent('');
    setNext('');
    setConfirm('');
  }

  function disable() {
    if (!isValidPin(current)) {
      snackbar.show('Kapatmak için mevcut PIN’ini gir.', 'error');
      return;
    }
    onDisable(current);
    setCurrent('');
  }

  return (
    <View style={styles.block}>
      <TextField label="Mevcut PIN" value={current} onChangeText={setCurrent} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} />
      <View style={styles.gap} />
      <TextField label="Yeni PIN" value={next} onChangeText={setNext} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} />
      <View style={styles.gap} />
      <TextField label="Yeni PIN (tekrar)" value={confirm} onChangeText={setConfirm} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} error={error} />
      <View style={styles.gap} />
      <FilledButtonLabel label="PIN’i değiştir" busy={busy} onPress={changePin} />
      <View style={styles.gap} />
      <FilledButtonLabel label="Kilidi kapat" busy={busy} onPress={disable} tone="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
  },
  block: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  gap: {
    height: gaps.rowLoose - 2,
  },
  divider: {
    height: borderWidth.hairline,
    marginVertical: spacing.xs,
    backgroundColor: colors.border,
  },
  bottom: {
    height: spacing.lg,
  },
});
