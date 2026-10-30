import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../design/tokens';
import { tapFeedback } from '../haptics';
import { textStyle } from '../design/typography';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type NavItem = {
  key: string;
  label: string;
  /** Aktif sekme ikonu. */
  icon: IoniconName;
  /** Pasif sekme ikonu. */
  iconOutline: IoniconName;
};

/**
 * Yüzen "ada" gezinmesi: ekranın altında, kenarlardan ayrık, hap biçimli tek parça. Pasif sekmeler yalnızca ikon,
 * aktif sekme ikon ve etiketiyle genişleyen tonlu bir haptır; geçişte hafif bir titreşim ve genişleme animasyonu
 * olur. İçerik altına geçer, ekranlar alt boşluğu `sizes.bottomNavHeight` ile ayırır.
 */
export function BottomNavigation({
  items,
  activeIndex,
  onChange,
}: {
  items: NavItem[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  return (
    <>
    <View pointerEvents="none" style={[styles.scrim, { height: insets.bottom + sizes.bottomNavHeight + spacing.xxl }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="navScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
            <Stop offset="0.55" stopColor={colors.background} stopOpacity={0.85} />
            <Stop offset="1" stopColor={colors.background} stopOpacity={0.98} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#navScrim)" />
      </Svg>
    </View>
    <View testID="bottom-navigation-wrap" pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + spacing.sm }]}>
      <View accessibilityRole="tablist" accessibilityLabel="Ana gezinme" style={styles.island}>
        {items.map((item, index) => {
          const active = index === activeIndex;
          const color = active ? colors.primary : colors.onSurfaceVariant;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                tapFeedback();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onChange(index);
              }}
              style={[styles.item, active && styles.itemActive]}
            >
              <Ionicons name={active ? item.icon : item.iconOutline} size={sizes.navIconSize} color={color} />
              {active ? (
                <Text style={textStyle('label', { color })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
    </>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: borderWidth.hairline,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surfaceHigh,
  },
  item: {
    height: sizes.minTouchTarget,
    minWidth: sizes.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  itemActive: {
    paddingHorizontal: spacing.md,
    backgroundColor: withAlpha(colors.primary, 0.18),
  },
}));
