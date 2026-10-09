import { useState } from 'react';
import { Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { SelectField, type SelectOption } from '../../../shared/widgets/SelectField';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { createSupportTicket } from '../data/supportRepository';
import { FEEDBACK_CATEGORIES, feedbackShareText, type FeedbackCategory, validateFeedbackMessage } from '../domain/feedbackRules';

const CATEGORY_OPTIONS: SelectOption<FeedbackCategory>[] = FEEDBACK_CATEGORIES.map((value) => ({ value, label: value }));

/**
 * Geri bildirim (Flutter `FeedbackScreen`): nasıl gönderilir kartı, tür seçimi, mesaj alanı, paylaşım ve destek kaydı.
 * Paylaşım mesajı tür bilgisiyle birlikte seçilen uygulamaya gider; destek kaydı doğrudan destek ekibine ulaşır.
 */
export function FeedbackScreen() {
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
    <View style={styles.screen}>
      <ScreenTopBar title="Geri bildirim" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={textStyle('cardTitle')}>Nasıl gönderilir?</Text>
          <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>
            Mesajını paylaşabilir veya doğrudan destek kaydı oluşturabilirsin.
          </Text>
        </View>

        <Spacer size={spacing.md} />
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
        <PrimaryButton label="Paylaşım ekranını aç" icon="share" onPress={() => void share()} disabled={!hasMessage || ticket.isPending} />
        <Spacer size={spacing.sm} />
        <OutlinedButton
          label={ticket.isPending ? 'Gönderiliyor…' : 'Destek kaydı oluştur'}
          onPress={() => {
            if (validate()) ticket.mutate();
          }}
        />
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
});
