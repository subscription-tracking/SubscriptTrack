import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
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
 * Kompakt üst bant: marka rengi zemin, solda geri, sağda düzenle ve ⋯ menüsü; altında logo, ad,
 * "₺761,12 / ay · Kategori" satırı ve aktif dışı durumlarda durum çipi.
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
    <View style={[styles.hero, { paddingTop: insets.top + spacing.xs, backgroundColor: brand }]}>
      <Backdrop />

      <View style={styles.controls}>
        <GlassButton icon="arrow-back-ios" label="Geri" onPress={onBack} />
        <View style={styles.controlsRight}>
          <GlassButton icon="edit" label="Düzenle" onPress={onEdit} />
          <GlassButton icon="more-vert" label="Menü" onPress={onMenu} />
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.logoTile}>
          <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.heroLogoIcon} />
        </View>
        <View style={styles.titleColumn}>
          <Text numberOfLines={1} style={textStyle('title', { color: colors.white })}>{subscription.name}</Text>
          <Text numberOfLines={1} style={textStyle('label', { color: withAlpha(colors.white, 0.86), marginTop: spacing.xxs })}>
            {`${formatAmount(subscription.amount.amount, subscription.currency)} ${periodSuffix(subscription.billingCycle)} · ${CATEGORY_LABELS[subscription.category]}`}
          </Text>
          {chip ? (
            <View style={styles.statusChip} accessibilityLabel={chip}>
              <Text style={textStyle('captionStrong', { color: colors.white })}>{chip}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Üstte hafif koyulaşan gölge ve sağ üstte beyaz %12 halka. */
function Backdrop() {
  useThemeRevision();
  const { width } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.scrim} stopOpacity={0.38} />
          <Stop offset="0.5" stopColor={colors.scrim} stopOpacity={0} />
          <Stop offset="1" stopColor={colors.scrim} stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroShade)" />
      <Circle cx={width - 70} cy={70} r={110} fill={withAlpha(colors.white, 0.12)} />
    </Svg>
  );
}

function GlassButton({ icon, label, onPress }: { icon: MaterialIconName; label: string; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.glass}>
      <MaterialIcons name={icon} size={sizes.glassIcon} color={colors.white} />
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
    paddingBottom: spacing.lg,
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  logoTile: {
    width: sizes.heroLogo,
    height: sizes.heroLogo,
    borderRadius: radius.logo,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.logoTile,
    borderWidth: borderWidth.focused,
    borderColor: withAlpha(colors.white, 0.25),
  },
  titleColumn: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.scrim, 0.35),
    borderWidth: borderWidth.regular,
    borderColor: withAlpha(colors.white, 0.25),
  },
}));
