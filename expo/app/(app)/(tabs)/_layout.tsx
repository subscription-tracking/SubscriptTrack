import { useThemeRevision } from '../../../src/shared/design/useThemeRevision';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';

import { BottomNavigation, type NavItem } from '../../../src/shared/widgets/BottomNavigation';
import { colors } from '../../../src/shared/design/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Alt gezinme sekmeleri (Flutter `BottomNavigation`): Ana sayfa, Abonelikler, İstatistikler, Ayarlar. */
const TAB_ITEMS: Record<string, NavItem> = {
  index: { key: 'index', label: 'Ana sayfa', icon: 'home', iconOutline: 'home-outline' },
  'subscriptions/index': { key: 'subscriptions', label: 'Abonelikler', icon: 'grid', iconOutline: 'grid-outline' },
  stats: { key: 'stats', label: 'İstatistikler', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
  'settings/index': { key: 'settings', label: 'Ayarlar', icon: 'settings', iconOutline: 'settings-outline' },
};

function AppTabBar({ state, navigation }: TabBarProps) {
  useThemeRevision();
  const items = state.routes.map((route: { name: string }) => TAB_ITEMS[route.name]);
  return (
    <BottomNavigation
      items={items}
      activeIndex={state.index}
      onChange={(index) => navigation.navigate(state.routes[index].name, undefined)}
    />
  );
}

/** Dört ana sekmenin kabuğu. Diğer tüm ekranlar (takvim, detay, ayarlar alt sayfaları) bu kabuğun dışında yığınla açılır. */
export default function TabsLayout() {
  useThemeRevision();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="subscriptions/index" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="settings/index" />
    </Tabs>
  );
}
