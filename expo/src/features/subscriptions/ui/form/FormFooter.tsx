import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, radius, spacing } from '../../../../shared/design/tokens';
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
        <View accessibilityRole="text" accessibilityLabel={`Aylık tahmin ${formatCurrency(preview.monthly, preview.currency)}, yıllık tahmin ${formatCurrency(preview.annual, preview.currency)}`} style={styles.summary}>
          <View>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Aylık tahmin</Text>
            <Text style={textStyle('bodyStrong')}>{formatCurrency(preview.monthly, preview.currency)}</Text>
          </View>
          <View style={styles.annual}>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Yıllık tahmin</Text>
            <Text style={textStyle('bodyStrong')}>{formatCurrency(preview.annual, preview.currency)}</Text>
          </View>
        </View>
      ) : (
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Maliyet özeti, tutar girdiğinde burada görünür.</Text>
      )}
      <PrimaryButton label={label} onPress={onSubmit} loading={loading} />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.medium,
    borderTopRightRadius: radius.medium,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  annual: {
    alignItems: 'flex-end',
  },
}));
