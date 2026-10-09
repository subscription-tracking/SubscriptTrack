import { useState } from 'react';
import { Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { colors, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { createSupportTicket } from '../data/supportRepository';
import { FEEDBACK_CATEGORIES, feedbackShareText, type FeedbackCategory, validateFeedbackMessage } from '../domain/feedbackRules';

const CATEGORY_OPTIONS: ChoiceOption<FeedbackCategory>[] = FEEDBACK_CATEGORIES.map((value) => ({ value, label: value }));

/** Geri bildirim: mesajı paylaş ya da destek kaydı oluştur. */
export function FeedbackScreen() {
  const snackbar = useSnackbar();
  const [category, setCategory] = useState<FeedbackCategory>(FEEDBACK_CATEGORIES[2]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      snackbar.show('Paylaşım açılamadı.', 'error');
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Geri bildirim" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>Tür</Text>
        <ChoiceChips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        <Spacer size={spacing.md} />
        <TextField label="Mesajın" value={message} onChangeText={setMessage} error={error} multiline maxLength={2000} editable={!ticket.isPending} />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Paylaşırsan mesajın tür bilgisiyle birlikte seçtiğin uygulamaya gider. Destek kaydı ise doğrudan bize ulaşır.
        </Text>
        <Spacer size={spacing.md} />
        <OutlinedButton label="Paylaş" onPress={() => void share()} />
        <Spacer size={spacing.xs} />
        <PrimaryButton
          label="Destek kaydı oluştur"
          onPress={() => {
            if (validate()) ticket.mutate();
          }}
          loading={ticket.isPending}
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
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
    gap: spacing.xs,
  },
});
