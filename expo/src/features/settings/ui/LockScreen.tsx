import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { isValidPin, PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../domain/appLockRules';
import { useAppLock } from './AppLockProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'] as const;

/** Uygulama kilidi ekranı: PIN tuş takımı ve (açıksa) biyometri. Tüm ekranı kaplar. */
export function LockScreen() {
  const { unlockWithPin, unlockWithBiometrics, biometricEnabled, attemptsLeft, lockoutRemainingMs } = useAppLock();
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const askedBiometrics = useRef(false);

  useEffect(() => {
    if (!biometricEnabled || askedBiometrics.current) return;
    askedBiometrics.current = true;
    void unlockWithBiometrics();
  }, [biometricEnabled, unlockWithBiometrics]);

  async function submit() {
    if (!isValidPin(pin)) return;
    setBusy(true);
    const result = await unlockWithPin(pin);
    setBusy(false);
    setPin('');
    if (result === 'wrong') setMessage(`PIN yanlış. Kalan deneme: ${attemptsLeft}`);
    else if (result === 'locked_out') setMessage(`Çok fazla hatalı deneme. ${Math.ceil(lockoutRemainingMs / 1000)} sn sonra tekrar dene.`);
    else setMessage(null);
  }

  function press(key: (typeof KEYS)[number]) {
    if (busy) return;
    if (key === 'del') return setPin((current) => current.slice(0, -1));
    if (key === 'bio') return void unlockWithBiometrics();
    if (pin.length < PIN_MAX_LENGTH) setPin((current) => current + key);
  }

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <MaterialIcons name="lock-outline" size={40} color={colors.primary} />
      <Text style={textStyle('title')}>Uygulama kilitli</Text>
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>PIN'ini gir.</Text>

      <View style={styles.dots} accessibilityLabel={`${pin.length} hane girildi`}>
        {Array.from({ length: PIN_MAX_LENGTH }, (_, index) => (
          <View key={index} style={[styles.dot, index < pin.length && styles.dotFilled]} />
        ))}
      </View>

      {message ? <Text style={textStyle('caption', { color: colors.error, textAlign: 'center' })}>{message}</Text> : null}

      <View style={styles.pad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key === 'del' ? 'Sil' : key === 'bio' ? 'Biyometri ile aç' : key}
            disabled={key === 'bio' && !biometricEnabled}
            onPress={() => press(key)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed, key === 'bio' && !biometricEnabled && styles.keyHidden]}
          >
            {key === 'del' ? (
              <MaterialIcons name="backspace" size={22} color={colors.onSurface} />
            ) : key === 'bio' ? (
              <MaterialIcons name="fingerprint" size={26} color={colors.primary} />
            ) : (
              <Text style={textStyle('title')}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.submit}>
        <PrimaryButton
          label="Aç"
          onPress={() => void submit()}
          disabled={!isValidPin(pin) || busy}
          loading={busy}
        />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant, textAlign: 'center' })}>
          {PIN_MIN_LENGTH}–{PIN_MAX_LENGTH} hane
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    zIndex: 100,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  key: {
    width: 72,
    height: sizes.minTouchTarget,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  keyPressed: {
    opacity: 0.7,
  },
  keyHidden: {
    backgroundColor: 'transparent',
  },
  submit: {
    width: 260,
    gap: spacing.xs,
  },
});
