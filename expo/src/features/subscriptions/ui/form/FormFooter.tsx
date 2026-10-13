import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '../../../../core/format/money';
import { spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { PrimaryButton } from '../../../../shared/widgets/PrimaryButton';
import { costPreview, type SubscriptionFormValues } from '../../domain/subscriptionForm';

/** Alt çubuk: tutar geçerliyse tek satır maliyet özeti ve kaydet düğmesi. */
export function FormFooter({
  values,
  label,
  loading,
  onSubmit,
}: {
  values: SubscriptionFormValues;
  label: string;
  loading: boolean;
  onSubmit: () => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const preview = costPreview(values);
  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
      {preview ? (
        <Text accessibilityRole="text" style={textStyle('bodySmall', { textAlign: 'center' })}>
          {`${formatCurrency(preview.monthly, preview.currency)} / ay · Yılda ${formatCurrency(preview.annual, preview.currency)}`}
        </Text>
      ) : null}
      <PrimaryButton label={label} onPress={onSubmit} loading={loading} />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
}));
