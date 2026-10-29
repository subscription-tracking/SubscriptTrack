import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatAmount } from '../../../../core/format/money';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { CATEGORY_LABELS, type Subscription } from '../../domain/subscription';
import { statusChipState } from '../../domain/statusChip';
import { ServiceIdentity, resolveServiceColor } from '../ServiceIdentity';
import { periodSuffix } from './detailFormat';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Koyu tema ile uyumlu üst alan; servis rengi yalnızca logoyu vurgular.
 * Geri, düzenle ve menü en az 48 dp; uzun ad ve fiyat satırları sarılır.
 */
export function DetailHero({
  subscription,
  onBack,
  onEdit,
  onMenu,
}: {
  subscription: Subscription;
  onBack: () => void;
  onEdit: () => void;
  onMenu: () => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const brand = resolveServiceColor(subscription.name, subscription.category);
  const chip = subscription.status === 'active'
    ? null
    : statusChipState({ status: subscription.status, isNotStarted: false, daysUntilRenewal: null }).label;
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.xs }]}>

      <View style={styles.controls}>
        <GlassButton icon="arrow-back-ios" label="Geri" onPress={onBack} />
        <View style={styles.controlsRight}>
          <GlassButton icon="edit" label="Düzenle" onPress={onEdit} />
          <GlassButton icon="more-vert" label="Menü" onPress={onMenu} />
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.logoTile, { borderColor: withAlpha(brand, 0.3) }]}>
          <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.heroLogoIcon} />
        </View>
        <View style={styles.titleColumn}>
          <Text accessibilityRole="header" style={textStyle('title')}>{subscription.name}</Text>
          <Text style={textStyle('label', { marginTop: spacing.xxs })}>
            {`${formatAmount(subscription.amount.amount, subscription.currency)} ${periodSuffix(subscription.billingCycle)}`}
          </Text>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xxs })}>{CATEGORY_LABELS[subscription.category]}</Text>
          {chip ? (
            <View style={styles.statusChip} accessibilityLabel={chip}>
              <Text style={textStyle('captionStrong', { color: colors.onSurfaceVariant })}>{chip}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function GlassButton({ icon, label, onPress }: { icon: MaterialIconName; label: string; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.glass}>
      <MaterialIcons name={icon} size={sizes.glassIcon} color={colors.onSurface} />
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  glass: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  logoTile: {
    width: sizes.heroLogoIcon + spacing.lg,
    height: sizes.heroLogoIcon + spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: borderWidth.regular,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
  },
}));
