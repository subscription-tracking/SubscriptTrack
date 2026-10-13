import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, type Subscription } from '../../subscriptions/domain/subscription';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';

/**
 * Flutter `CalendarEventItem`: kart içinde hizmet kimliği, ad, alt satır (deneme ise "Deneme bitişi", değilse
 * yenileme sıklığı) ve sağda primary kalın tutar.
 */
export function CalendarEventItem({ subscription, date, isTrial, onPress }: { subscription: Subscription; date: CivilDate; isTrial: boolean; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatLongDate(date)}, ${subscription.name}, ${isTrial ? 'deneme bitişi' : 'yenileme'}, ${formatCurrency(subscription.amount, subscription.currency)}`}
      accessibilityHint="Abonelik ayrıntılarını açar."
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.calendarAvatar} />
      <View style={styles.texts}>
        <Text style={textStyle('label')}>{subscription.name}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          {isTrial ? 'Deneme bitişi' : BILLING_CYCLE_LABELS[subscription.billingCycle]}
        </Text>
      </View>
      <Text style={textStyle('label', { color: colors.primary })}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxs,
    paddingHorizontal: gaps.cardInset,
    paddingVertical: gaps.heroLabel + spacing.xxs,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  texts: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
}));
