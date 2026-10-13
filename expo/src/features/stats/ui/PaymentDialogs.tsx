import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LockAwareModal } from '../../../shared/widgets/LockAwareModal';

import { Money } from '../../../core/domain/money';
import { colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textButtonText, textStyle } from '../../../shared/design/typography';
import { SelectField } from '../../../shared/widgets/SelectField';
import { TextField } from '../../../shared/widgets/TextField';
import { type Subscription } from '../../subscriptions/domain/subscription';

/** Flutter `_validateAmount`: virgül ondalık ayırıcıdır; sıfırdan büyük geçerli bir tutar gerekir. */
export function parseAmountInput(input: string): Money | null {
  const money = Money.tryParse(input.replace(',', '.'));
  return money && money.compareTo(Money.zero) > 0 ? money : null;
}

/** Ortak iletişim kutusu: ortada kart, başlık ve alt sıra düğmeler (Flutter `AlertDialog`). */
export function DialogShell({
  visible,
  title,
  onClose,
  children,
  actions,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}) {
  useThemeRevision();
  return (
    <LockAwareModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={textStyle('title')}>{title}</Text>
          <View style={styles.body}>{children}</View>
          <View style={styles.actions}>{actions}</View>
        </View>
      </View>
    </LockAwareModal>
  );
}

export function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textAction}>
      <Text style={textButtonText}>{label}</Text>
    </Pressable>
  );
}

export function FilledAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.filled, disabled ? styles.disabled : null]}>
      <Text style={textStyle('bodyStrong', { color: colors.onPrimary })}>{label}</Text>
    </Pressable>
  );
}

/** "Ödeme kaydı ekle": abonelik seçimi (ilk seçenek varsayılan) ve tutar. Seçim değişince tutar o aboneliğin tutarına döner. */
export function AddPaymentDialog({
  visible,
  subscriptions,
  onClose,
  onSave,
}: {
  visible: boolean;
  subscriptions: Subscription[];
  onClose: () => void;
  onSave: (input: { subscription: Subscription; amount: Money }) => void;
}) {
  useThemeRevision();
  const first = subscriptions[0];
  const [selectedId, setSelectedId] = useState(first?.id ?? '');
  const selected = subscriptions.find((item) => item.id === selectedId) ?? first;
  const [amount, setAmount] = useState(selected ? selected.amount.amount.toFixed(2) : '');
  const [invalid, setInvalid] = useState(false);
  const initializedForOpen = useRef(false);
  const firstId = first?.id ?? '';
  const firstAmount = first ? first.amount.amount.toFixed(2) : '';

  useEffect(() => {
    if (!visible) {
      initializedForOpen.current = false;
      return;
    }
    if (initializedForOpen.current || !firstId) return;

    // Abonelikler dialog açıldıktan sonra yüklenebilir. İlk seçenek hazır
    // olduğunda formu başlat; sonraki açılışta da önceki girişi temizle.
    initializedForOpen.current = true;
    setSelectedId(firstId);
    setAmount(firstAmount);
    setInvalid(false);
  }, [visible, firstId, firstAmount]);

  function pick(id: string) {
    setSelectedId(id);
    const next = subscriptions.find((item) => item.id === id);
    if (next) setAmount(next.amount.amount.toFixed(2));
  }

  function save() {
    const money = parseAmountInput(amount);
    if (!money || !selected) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSave({ subscription: selected, amount: money });
  }

  return (
    <DialogShell
      visible={visible}
      title="Ödeme kaydı ekle"
      onClose={onClose}
      actions={
        <>
          <TextAction label="İptal" onPress={onClose} />
          <FilledAction label="Kaydet" onPress={save} />
        </>
      }
    >
      <SelectField
        label="Abonelik"
        value={selected?.id ?? ''}
        options={subscriptions.map((item) => ({ value: item.id, label: item.name }))}
        onChange={pick}
      />
      <View style={styles.gap} />
      <TextField
        label={`Tutar (${selected?.currency ?? ''})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        error={invalid ? 'Geçerli tutar gir' : null}
      />
    </DialogShell>
  );
}

/** "Ödeme kaydını düzenle": yalnızca tutar değişir; para birimi ve tarih korunur. */
export function EditPaymentDialog({
  visible,
  currency,
  initialAmount,
  onClose,
  onSave,
}: {
  visible: boolean;
  currency: string;
  initialAmount: string;
  onClose: () => void;
  onSave: (amount: Money) => void;
}) {
  useThemeRevision();
  const [amount, setAmount] = useState(initialAmount);
  const [invalid, setInvalid] = useState(false);

  function save() {
    const money = parseAmountInput(amount);
    if (!money) {
      setInvalid(true);
      return;
    }
    onSave(money);
  }

  return (
    <DialogShell
      visible={visible}
      title="Ödeme kaydını düzenle"
      onClose={onClose}
      actions={
        <>
          <TextAction label="İptal" onPress={onClose} />
          <FilledAction label="Kaydet" onPress={save} />
        </>
      }
    >
      <TextField
        label={`Tutar (${currency})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        error={invalid ? 'Geçerli tutar gir' : null}
      />
    </DialogShell>
  );
}

const styles = themedStyles(() => StyleSheet.create({
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
  },
  body: {
    marginTop: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  textAction: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  filled: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
}));

