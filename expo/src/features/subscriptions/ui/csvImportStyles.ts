import { themedStyles } from '../../../shared/design/themeRuntime';
import { StyleSheet } from 'react-native';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';

export const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  start: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    width: sizes.minTouchTarget - spacing.md,
    height: sizes.minTouchTarget - spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  gapSmall: {
    height: gaps.rowLoose - 2,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  textButtonLabel: {
    marginLeft: spacing.xs,
  },
  list: {
  },
  errors: {
    marginTop: gaps.rowLoose - 2,
    gap: spacing.xxs,
  },
  statusWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.small,
    backgroundColor: colors.surfaceHigh,
  },
  statusWarningText: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  gapRows: {
    height: gaps.cardInset,
  },
  row: {
    paddingVertical: spacing.xs,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: withAlpha(colors.scrim, 0.54),
  },
  dialog: {
    padding: spacing.lg,
    borderRadius: radius.sheet,
    backgroundColor: colors.surfaceHigh,
    gap: spacing.xs,
  },
  codeBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.field - 4,
    backgroundColor: colors.surfaceContainerHighest,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  dialogButton: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
}));
