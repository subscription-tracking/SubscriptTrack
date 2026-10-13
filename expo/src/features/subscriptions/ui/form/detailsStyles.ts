import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet } from 'react-native';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../../shared/design/tokens';

export const styles = themedStyles(() => StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.tileMinHeight,
  },
  toggleText: {
    flex: 1,
    marginLeft: gaps.rowLoose - 2,
    marginRight: spacing.xs,
  },
  fields: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.tileMinHeight,
  },
  trialText: {
    flex: 1,
  },
  statusChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.choice,
    borderWidth: borderWidth.statsEdge,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surfaceHigh,
  },
  statusChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
}));
