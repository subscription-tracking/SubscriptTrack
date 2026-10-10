import { Text, View, StyleSheet } from 'react-native';

import { borderWidth, colors, radius, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type ChipTone, statusChipState } from '../domain/statusChip';
import { type SubscriptionStatus } from '../domain/subscription';

/** Flutter `SubscriptionStatusChip`: tonlu hap, %14 dolgu, %28 kenarlık, 11 px kalın yazı. */
export function SubscriptionStatusChip({
  status,
  isNotStarted = false,
  daysUntilRenewal = null,
}: {
  status: SubscriptionStatus;
  isNotStarted?: boolean;
  daysUntilRenewal?: number | null;
}) {
  const state = statusChipState({ status, isNotStarted, daysUntilRenewal });
  const color = toneColor(state.tone);
  return (
    <View
      accessibilityLabel={state.label}
      style={[styles.chip, { backgroundColor: withAlpha(color, 0.14), borderColor: withAlpha(color, 0.28) }]}
    >
      <Text style={textStyle('labelSmallStrong', { color })}>{state.label}</Text>
    </View>
  );
}

export function toneColor(tone: ChipTone): string {
  switch (tone) {
    case 'primary':
      return colors.primary;
    case 'warning':
      return statusColors.warning;
    case 'error':
      return colors.error;
    case 'trial':
      return statusColors.trial;
    case 'muted':
      return statusColors.mutedText;
    case 'success':
      return statusColors.success;
  }
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
  },
});
