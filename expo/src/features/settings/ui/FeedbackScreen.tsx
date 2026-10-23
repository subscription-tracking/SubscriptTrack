import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { Share, ScrollView, StyleSheet, Text } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { colors, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { SelectField, type SelectOption } from '../../../shared/widgets/SelectField';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { createSupportTicket } from '../data/supportRepository';
import { FEEDBACK_CATEGORIES, feedbackShareText, type FeedbackCategory, validateFeedbackMessage } from '../domain/feedbackRules';
import { SettingsPanel } from './SettingsControls';

const CATEGORY_OPTIONS: SelectOption<FeedbackCategory>[] = FEEDBACK_CATEGORIES.map((value) => ({ value, label: value }));

/**
 * Geri bildirim (Flutter `FeedbackScreen`): nasıl gönderilir kartı, tür seçimi, mesaj alanı, paylaşım ve destek kaydı.
 * Paylaşım mesajı tür bilgisiyle birlikte seçilen uygulamaya gider; destek kaydı doğrudan destek ekibine ulaşır.
 */
export function FeedbackScreen() {
  useThemeRevision();
  const snackbar = useSnackbar();
  const [category, setCategory] = useState<FeedbackCategory>(FEEDBACK_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasMessage = message.trim().length > 0;

  const ticket = useMutation({
    mutationFn: () => createSupportTicket({ message, category }),
    onSuccess: () => {
      setMessage('');
      snackbar.show('Destek kaydı oluşturuldu.', 'primary');
    },
    onError: (err: Error) => snackbar.show(err.message, 'error'),
  });

  function validate(): boolean {
    const problem = validateFeedbackMessage(message);
    setError(problem);
    return problem === null;
  }

  async function share() {
    if (!validate()) return;
    try {
      await Share.share({ message: feedbackShareText(category, message), title: 'SubscriptTrack geri bildirimi' });
      snackbar.show('Geri bildirim paylaşım ekranı açıldı.', 'default');
    } catch {
      snackbar.show('Paylaşım açılamadı.', 'error');
    }
  }

  return (
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title="Geri bildirim" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SettingsPanel style={styles.card}>
          <Text style={textStyle('bodyStrong')}>Nasıl gönderilir?</Text>
          <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>
            Destek kaydı mesajını doğrudan ekibe iletir ve cevap alırsın. Paylaşım ekranı ise mesajını seçtiğin uygulamayla göndermeni sağlar.
          </Text>
        </SettingsPanel>

        <Spacer size={spacing.md} />
        <SettingsPanel style={styles.formPanel}>
        <SelectField label="Tür" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} disabled={ticket.isPending} />

        <Spacer size={spacing.md} />
        <TextField
          label="Mesajın"
          value={message}
          onChangeText={setMessage}
          error={error}
          placeholder="Ne geliştirebiliriz?"
          multiline
          maxLength={2000}
          editable={!ticket.isPending}
        />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
          {hasMessage ? 'Kategori ve mesaj paylaşım içeriğine eklenir.' : 'Paylaşmak için mesaj yazmalısın.'}
        </Text>

        <Spacer size={spacing.lg} />
        <PrimaryButton
          label="Destek kaydı oluştur"
          loading={ticket.isPending}
          onPress={() => {
            if (validate()) ticket.mutate();
          }}
        />
        <Spacer size={spacing.sm} />
        <TonalButton label="Paylaşım ekranını aç" onPress={() => void share()} disabled={!hasMessage || ticket.isPending} />
        </SettingsPanel>
        <ScreenBottomInset />
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  formPanel: {
    padding: spacing.md,
  },
}));
