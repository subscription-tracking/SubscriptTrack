import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { themedStyles } from '../../src/shared/design/themeRuntime';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../src/shared/design/tokens';
import { SubscriptionRealtimeSync } from '../../src/features/subscriptions/ui/SubscriptionRealtimeSync';
import { SubscriptionOfflineBanner, SubscriptionOfflineSync } from '../../src/features/subscriptions/ui/SubscriptionOfflineSync';
import { NotificationSync } from '../../src/features/notifications/ui/NotificationSync';

/**
 * Oturum açmış kullanıcının kabuğu. Dört ana sekme `(tabs)` grubundadır (alt gezinme burada);
 * diğer tüm ekranlar Flutter'daki gibi alt gezinmesiz, yığında açılır.
 */
export default function AppLayout() {
  useThemeRevision();
  return (
    <View style={styles.shell}>
      <SubscriptionRealtimeSync />
      <SubscriptionOfflineSync />
      <SubscriptionOfflineBanner />
      <NotificationSync />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  shell: {
    flex: 1,
  },
}));
