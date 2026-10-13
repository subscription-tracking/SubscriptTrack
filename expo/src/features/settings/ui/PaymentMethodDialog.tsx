import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LockAwareModal } from '../../../shared/widgets/LockAwareModal';

import { colors, radius, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { METHOD_MAX_LENGTH } from '../domain/paymentMethodRules';

/**
 * Ödeme yöntemi ekle / düzenle diyaloğu (Flutter `AlertDialog`): başlık, ad alanı, İptal ve onay düğmesi.
 * `onSubmit` doğrulama hatası döndürürse diyalog açık kalır; `null` dönerse ebeveyn diyaloğu kapatır.
 */
export function PaymentMethodDialog({
  title,
  confirmLabel,
  initialName = '',
  onCancel,
  onSubmit,
}: {
  title: string;
  confirmLabel: string;
  initialName?: string;
  onCancel: () => void;
  onSubmit: (name: string) => string | null;
}) {
  useThemeRevision();
  const [draft, setDraft] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  return (
    <LockAwareModal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dialog}>
          <Text style={textStyle('titleSmall')}>{title}</Text>
          <Spacer size={spacing.md} />
          <TextField
            label="Ödeme yöntemi adı"
            value={draft}
            onChangeText={(next) => {
              setDraft(next);
              setError(null);
            }}
            error={error}
            maxLength={METHOD_MAX_LENGTH}
            autoCapitalize="words"
            autoFocus
          />
          <Spacer size={spacing.lg} />
          <View style={styles.actions}>
            <View style={styles.action}>
              <OutlinedButton label="İptal" onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <PrimaryButton label={confirmLabel} tall={false} onPress={() => setError(onSubmit(draft))} />
            </View>
          </View>
        </View>
      </View>
    </LockAwareModal>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: withAlpha(colors.background, 0.6),
  },
  dialog: {
    padding: spacing.lg,
    borderRadius: radius.sheet,
    backgroundColor: colors.surfaceLow,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
}));
