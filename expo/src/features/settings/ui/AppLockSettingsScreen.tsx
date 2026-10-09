import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { createPinRecord, verifyPinRecord } from '../../../core/security/pinRecord';
import { useAppLock } from '../ui/AppLockProvider';
import { biometricsAvailable } from '../data/biometrics';
import { readAppLock, writeBiometric, writePinRecord, writeTimeoutMinutes } from '../data/appLockStore';
import { isValidPin, LOCK_TIMEOUT_OPTIONS_MINUTES, PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../domain/appLockRules';

const TIMEOUT_LABELS: Record<number, string> = { 0: 'Hemen', 1: '1 dk', 5: '5 dk', 15: '15 dk' };
const TIMEOUT_OPTIONS: ChoiceOption<string>[] = LOCK_TIMEOUT_OPTIONS_MINUTES.map((minutes) => ({
  value: String(minutes),
  label: TIMEOUT_LABELS[minutes],
}));

/** Uygulama kilidi ayarları: PIN oluştur, değiştir, kapat; biyometri; kilit süresi. */
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

  const updateTimeout = useMutation({
    mutationFn: (minutes: number) => writeTimeoutMinutes(minutes),
    onSuccess: async () => {
      await lock.refresh();
    },
  });

  const toggleBiometric = useMutation({
    mutationFn: (enabled: boolean) => writeBiometric(enabled),
    onSuccess: async () => {
      await lock.refresh();
    },
  });

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Uygulama kilidi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {lock.enabled ? <EnabledSection onChangePin={(pin, current) => savePin.mutate({ pin, current })} onDisable={(current) => disable.mutate(current)} busy={savePin.isPending || disable.isPending} /> : <SetupSection onSetup={(pin) => savePin.mutate({ pin })} busy={savePin.isPending} />}

        {lock.enabled ? (
          <>
            <Spacer size={spacing.md} />
            <View style={styles.card}>
              <Text style={textStyle('titleSmall')}>Kilit süresi</Text>
              <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Uygulama arka plana gittikten sonra bu süre dolunca kilitlenir.</Text>
              <ChoiceChips
                options={TIMEOUT_OPTIONS}
                value={String(lock.timeoutMinutes)}
                onChange={(value) => updateTimeout.mutate(Number(value))}
              />
            </View>

            <Spacer size={spacing.md} />
            <View style={styles.card}>
              <CheckboxRow
                checked={lock.biometricEnabled}
                onChange={(enabled) => {
                  if (enabled && !hasBiometrics) {
                    snackbar.show('Bu cihazda kayıtlı biyometri bulunamadı.', 'error');
                    return;
                  }
                  toggleBiometric.mutate(enabled);
                }}
              >
                <Text style={textStyle('bodySmall')}>Biyometri ile aç</Text>
              </CheckboxRow>
              <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
                {hasBiometrics ? 'Parmak izi veya yüz tanıma ile açılır; PIN her zaman yedek olarak kalır.' : 'Bu cihazda biyometri kullanılamıyor.'}
              </Text>
            </View>
          </>
        ) : null}
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
  );
}

function SetupSection({ onSetup, busy }: { onSetup: (pin: string) => void; busy: boolean }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!isValidPin(pin)) return setError(`PIN ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} rakam olmalı`);
    if (pin !== confirm) return setError('PIN\'ler eşleşmiyor');
    setError(null);
    onSetup(pin);
  }

  return (
    <View style={styles.card}>
      <Text style={textStyle('titleSmall')}>Uygulama kilidini aç</Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Uygulamayı açarken PIN iste. PIN cihazında özetlenmiş olarak saklanır; sunucuya gönderilmez.
      </Text>
      <TextField label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} />
      <TextField label="PIN (tekrar)" value={confirm} onChangeText={setConfirm} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} error={error} />
      <PrimaryButton label="PIN'i kaydet" onPress={submit} loading={busy} />
    </View>
  );
}

function EnabledSection({
  onChangePin,
  onDisable,
  busy,
}: {
  onChangePin: (pin: string, current: string) => void;
  onDisable: (current: string) => void;
  busy: boolean;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const snackbar = useSnackbar();

  function changePin() {
    if (!isValidPin(current)) return setError('Mevcut PIN\'ini gir');
    if (!isValidPin(next)) return setError(`Yeni PIN ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} rakam olmalı`);
    if (next !== confirm) return setError('Yeni PIN\'ler eşleşmiyor');
    setError(null);
    onChangePin(next, current);
    setCurrent('');
    setNext('');
    setConfirm('');
  }

  function disable() {
    if (!isValidPin(current)) {
      snackbar.show('Kapatmak için mevcut PIN\'ini gir.', 'error');
      return;
    }
    onDisable(current);
    setCurrent('');
  }

  return (
    <View style={styles.card}>
      <Text style={textStyle('titleSmall')}>PIN</Text>
      <TextField label="Mevcut PIN" value={current} onChangeText={setCurrent} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} />
      <TextField label="Yeni PIN" value={next} onChangeText={setNext} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} />
      <TextField label="Yeni PIN (tekrar)" value={confirm} onChangeText={setConfirm} keyboardType="number-pad" secureTextEntry maxLength={PIN_MAX_LENGTH} editable={!busy} error={error} />
      <PrimaryButton label="PIN'i değiştir" onPress={changePin} loading={busy} />
      <OutlinedButton label="Kilidi kapat" onPress={disable} />
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
    gap: spacing.sm,
  },
});
