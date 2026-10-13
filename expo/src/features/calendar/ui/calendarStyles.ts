import { themedStyles } from '../../../shared/design/themeRuntime';
import { StyleSheet } from 'react-native';
import { borderWidth, colors, gaps, sizes, spacing } from '../../../shared/design/tokens';

export const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  navButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  week: {
    flexDirection: 'row',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  legendDot: {
    width: sizes.calendarDot + 1,
    height: sizes.calendarDot + 1,
    borderRadius: (sizes.calendarDot + 1) / 2,
  },
  divider: {
    height: gaps.sectionTop - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dividerLine: {
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: sizes.bottomNavHeight + spacing.xl,
  },
}));

