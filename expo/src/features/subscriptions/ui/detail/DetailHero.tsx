import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LockAwareModal } from '../../../../shared/widgets/LockAwareModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatAmount } from '../../../../core/format/money';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, type Subscription, type SubscriptionStatus } from '../../domain/subscription';
import { ServiceIdentity, resolveServiceColor } from '../ServiceIdentity';
import { canTransition } from '../../domain/statusTransitions';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type DetailMenuAction = 'pause' | 'resume' | 'cancel' | 'archive';

/** Flutter `DetailHeroHeader`: marka rengi zemin, üstten koyulaşan gradyan, cam düğmeler ve logo kutusu. */
export function DetailHero({
  subscription,
  onBack,
  onEdit,
  onMenuAction,
}: {
  subscription: Subscription;
  onBack: () => void;
  onEdit: () => void;
  onMenuAction: (action: DetailMenuAction) => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const brand = resolveServiceColor(subscription.name, subscription.category);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <View style={[styles.hero, { height: sizes.heroHeight + insets.top, backgroundColor: brand }]}>
      <Backdrop height={sizes.heroHeight + insets.top} />

      <View style={[styles.controls, { top: insets.top + spacing.xs, left: spacing.md, right: spacing.md }]}>
        <GlassButton icon="arrow-back-ios" label="Geri" onPress={onBack} />
        <View style={styles.controlsRight}>
          <GlassButton icon="edit" label="Düzenle" onPress={onEdit} />
          <View style={styles.menuGap} />
          <GlassButton icon="more-vert" label="Menü" onPress={() => setMenuOpen(true)} size={sizes.glassButton} iconSize={sizes.menuIcon} />
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.logoTile}>
          <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.heroLogoIcon} />
        </View>
        <View style={styles.titleColumn}>
          <Text numberOfLines={1} style={textStyle('headline', { color: colors.white, letterSpacing: -0.5 })}>
            {subscription.name}
          </Text>
          <Text numberOfLines={1} style={textStyle('label', { color: withAlpha(colors.white, 0.82), marginTop: spacing.xxs })}>
            {`${BILLING_CYCLE_LABELS[subscription.billingCycle]} • ${formatAmount(subscription.amount.amount, subscription.currency)}`}
          </Text>
        </View>
      </View>

      <DetailMenu
        visible={menuOpen}
        status={subscription.status}
        onClose={() => setMenuOpen(false)}
        onSelect={(action) => {
          setMenuOpen(false);
          onMenuAction(action);
        }}
      />
    </View>
  );
}

/** Flutter `_Backdrop`: 0 → 0.4 → 1 gradyan (siyah %38, şeffaf, arka plan) ve sağ üstte beyaz %12 halka. */
function Backdrop({ height }: { height: number }) {
  useThemeRevision();
  const { width } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.scrim} stopOpacity={0.38} />
          <Stop offset="0.4" stopColor={colors.scrim} stopOpacity={0} />
          <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#heroShade)" />
      <Circle cx={width + 40 - 110} cy={-40 + 110} r={110} fill={withAlpha(colors.white, 0.12)} />
    </Svg>
  );
}

function GlassButton({
  icon,
  label,
  onPress,
  size = sizes.glassButton,
  iconSize = sizes.glassIcon,
}: {
  icon: MaterialIconName;
  label: string;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.glass, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <MaterialIcons name={icon} size={iconSize} color={colors.white} />
    </Pressable>
  );
}

function DetailMenu({
  visible,
  status,
  onClose,
  onSelect,
}: {
  visible: boolean;
  status: SubscriptionStatus;
  onClose: () => void;
  onSelect: (action: DetailMenuAction) => void;
}) {
  useThemeRevision();
  const items: { action: DetailMenuAction; label: string; icon: MaterialIconName }[] = [
    ...(canTransition(status, 'paused') ? [{ action: 'pause' as const, label: 'Duraklat', icon: 'pause-circle-outline' as const }] : []),
    ...(canTransition(status, 'active') ? [{ action: 'resume' as const, label: status === 'cancelled' ? 'Yeniden Etkinleştir' : status === 'archived' ? 'Arşivden Çıkar' : status === 'trial' || status === 'expired' ? 'Aktif Yap' : 'Devam Ettir', icon: 'play-circle-outline' as const }] : []),
    ...(canTransition(status, 'cancelled') ? [{ action: 'cancel' as const, label: 'İptal Et', icon: 'cancel' as const }] : []),
    ...(canTransition(status, 'archived') ? [{ action: 'archive' as const, label: 'Arşivle', icon: 'archive' as const }] : []),
  ];
  return (
    <LockAwareModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Menüyü kapat" style={styles.menuBackdrop} onPress={onClose}>
        <View style={styles.menu}>
          {items.map((item) => (
            <Pressable key={item.action} accessibilityRole="menuitem" onPress={() => onSelect(item.action)} style={styles.menuItem}>
              <MaterialIcons name={item.icon} size={sizes.menuIcon} color={colors.onSurface} />
              <Text style={[textStyle('body'), styles.menuLabel]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </LockAwareModal>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  controls: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuGap: {
    width: spacing.xs,
  },
  glass: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.scrim, 0.28),
    borderWidth: borderWidth.regular,
    borderColor: withAlpha(colors.white, 0.15),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  menuBackdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: sizes.heroHeight / 3,
    paddingRight: spacing.md,
    backgroundColor: 'transparent',
  },
  menu: {
    minWidth: sizes.menuWidth,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuLabel: {
    marginLeft: spacing.sm,
  },
}));
