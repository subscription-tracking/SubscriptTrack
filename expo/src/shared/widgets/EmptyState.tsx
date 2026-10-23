import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';
import { PrimaryButton } from './PrimaryButton';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Boş ekran kartı için ortak yatay genişlik ve dikey merkez; isteğe bağlı alt eylem merkezi kaydırmaz. */
export function EmptyStateLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  useThemeRevision();
  return (
    <View style={styles.stage}>
      <View style={styles.center}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

/**
 * Flutter `AppEmptyState`: yüzey kartı içinde tonlu daire, başlık, açıklama ve isteğe bağlı
 * "ekle" düğmesi. `compact` daha küçük ölçü kullanır.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: {
  icon: MaterialIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  useThemeRevision();
  const iconSize = compact ? sizes.emptyIconCompact : sizes.emptyIconLarge;
  const orbSize = compact ? sizes.emptyOrbCompact : sizes.emptyOrbLarge;
  return (
    <View style={[styles.card, { paddingVertical: compact ? spacing.xl : spacing.xxl }]}>
      <View
        style={[
          styles.orb,
          {
            width: orbSize,
            height: orbSize,
            borderRadius: orbSize / 2,
            backgroundColor: withAlpha(colors.primary, 0.1),
            borderColor: withAlpha(colors.primary, 0.2),
          },
        ]}
      >
        <MaterialIcons name={icon} size={iconSize} color={colors.primary} />
      </View>
      <Text style={[textStyle('bodyStrong'), styles.centered, styles.title]}>{title}</Text>
      <Text style={[textStyle('bodySmall'), styles.centered, styles.description]}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} icon="add" tall={false} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  stage: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  footer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.md,
    left: spacing.lg,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.hairline,
  },
  title: {
    marginTop: spacing.md,
  },
  description: {
    marginTop: spacing.xs,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
}));
