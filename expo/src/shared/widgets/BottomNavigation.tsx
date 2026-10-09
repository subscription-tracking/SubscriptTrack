import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { borderWidth, colors, extraRadius, extraSpacing, sizes } from '../design/tokens';
import { textStyle } from '../design/typography';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type NavItem = {
  key: string;
  label: string;
  /** Aktif sekme ikonu (Flutter `*_rounded`). */
  icon: IoniconName;
  /** Pasif sekme ikonu (Flutter `*_outlined`). */
  iconOutline: IoniconName;
};

/**
 * Flutter `BottomNavigation` karşılığı: yüzey rengi, üst kenar çizgisi, aktif sekmede 30 × 2 gösterge,
 * 22 px ikon ve 11 px etiket. Yükseklik 64 + cihaz alt güvenli alanı.
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
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: sizes.bottomNavHeight + insets.bottom, paddingBottom: insets.bottom }]}>
      {items.map((item, index) => {
        const active = index === activeIndex;
        const color = active ? colors.primary : colors.onSurfaceVariant;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(index)}
            style={styles.item}
          >
            <View
              style={[
                styles.indicator,
                { width: active ? sizes.navIndicatorWidth : 0, backgroundColor: colors.primary },
              ]}
            />
            <Ionicons name={active ? item.icon : item.iconOutline} size={sizes.navIconSize} color={color} />
            <Text numberOfLines={1} style={textStyle(active ? 'labelSmallStrong' : 'labelSmall', { color, marginTop: extraSpacing.navLabelGap })}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    height: sizes.bottomNavHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    height: sizes.navIndicatorHeight,
    borderRadius: extraRadius.navIndicator,
    marginBottom: extraSpacing.navIndicatorGap,
  },
});
