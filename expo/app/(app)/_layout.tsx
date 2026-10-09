import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { borderWidth, colors } from '../../src/shared/design/tokens';
import { textStyle } from '../../src/shared/design/typography';
import { SubscriptionRealtimeSync } from '../../src/features/subscriptions/ui/SubscriptionRealtimeSync';
import { SubscriptionOfflineBanner, SubscriptionOfflineSync } from '../../src/features/subscriptions/ui/SubscriptionOfflineSync';
import { NotificationSync } from '../../src/features/notifications/ui/NotificationSync';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: MaterialIconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialIcons name={name} color={color as string} size={size} />
  );
}

/**
 * Oturum açmış kullanıcının alt sekme gezinmesi (Flutter `BottomNavigation` karşılığı).
 * Sekme sırası ve adları Flutter ile aynıdır: Ana sayfa, Abonelikler, Takvim, İstatistik, Ayarlar.
 */
export default function AppTabsLayout() {
  return (
    <View style={styles.shell}>
      <SubscriptionRealtimeSync />
      <SubscriptionOfflineSync />
      <SubscriptionOfflineBanner />
      <NotificationSync />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: borderWidth.hairline,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarLabelStyle: textStyle('caption'),
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Ana sayfa', tabBarIcon: tabIcon('home') }} />
        <Tabs.Screen name="subscriptions/index" options={{ title: 'Abonelikler', tabBarIcon: tabIcon('subscriptions') }} />
        <Tabs.Screen name="calendar" options={{ title: 'Takvim', tabBarIcon: tabIcon('calendar-today') }} />
        <Tabs.Screen name="stats" options={{ title: 'İstatistik', tabBarIcon: tabIcon('insights') }} />
        <Tabs.Screen name="subscriptions/[id]" options={{ href: null }} />
        <Tabs.Screen name="subscriptions/add" options={{ href: null }} />
        <Tabs.Screen name="subscriptions/archived" options={{ href: null }} />
        <Tabs.Screen name="subscriptions/[id]/edit" options={{ href: null }} />
        <Tabs.Screen name="subscriptions/[id]/cancel" options={{ href: null }} />
        <Tabs.Screen name="stats/payments" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="settings/notifications" options={{ href: null }} />
        <Tabs.Screen name="settings/profile" options={{ href: null }} />
        <Tabs.Screen name="settings/appearance" options={{ href: null }} />
        <Tabs.Screen name="settings/app-lock" options={{ href: null }} />
        <Tabs.Screen name="settings/privacy" options={{ href: null }} />
        <Tabs.Screen name="settings/export" options={{ href: null }} />
        <Tabs.Screen name="settings/delete-account" options={{ href: null }} />
        <Tabs.Screen name="settings/feedback" options={{ href: null }} />
        <Tabs.Screen name="settings/payment-methods" options={{ href: null }} />
        <Tabs.Screen name="subscriptions/import" options={{ href: null }} />
        <Tabs.Screen name="savings" options={{ href: null }} />
        <Tabs.Screen name="settings/index" options={{ title: 'Ayarlar', tabBarIcon: tabIcon('settings') }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
