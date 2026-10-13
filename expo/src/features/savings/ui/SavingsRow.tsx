import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { borderWidth, colors, gaps, radius, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { monthlyEquivalent, type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Flutter `_SavingsRow`: aktif bir aboneliğin aylık tutarı ve sağda yıllık maliyeti.
 */
export function SavingsRow({ subscription }: { subscription: Subscription }) {
  useThemeRevision();
  const monthly = monthlyEquivalent(subscription);
  const yearly = monthly.multiply(12);
  return (
    <View style={styles.card}>
      <View style={styles.texts}>
        <Text style={textStyle('body')}>{subscription.name}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${formatCurrency(monthly, subscription.currency)}/ay`}</Text>
      </View>
      <Text style={textStyle('label')}>{`${formatCurrency(yearly, subscription.currency)}/yıl`}</Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: gaps.cardInset,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.outlineHalf,
    backgroundColor: colors.surface,
  },
  texts: {
    flex: 1,
  },
}));
