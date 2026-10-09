import type { ComponentProps, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../auth/AuthProvider';
import { useNotificationsQuery } from '../../notifications/data/queries';
import { unreadCount } from '../../notifications/domain/notificationCenter';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { activeForTotals } from '../../dashboard/domain/dashboardSummary';
import { colors } from '../../../shared/design/tokens';
import { TopBar } from '../../../shared/widgets/TopBar';
import { activeSubtitle, greetingFor, homeDateLabel } from '../domain/tabHeader';
import { zoneToday, deviceTimeZone } from '../../../core/time/calendar';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabKey = 'home' | 'subscriptions' | 'stats' | 'settings';

/**
 * Dört ana sekmenin ortak iskeleti: üst bar (Flutter `TopBar`) ve içerik. Her sekmenin başlık metni
 * Flutter `AppShell._topBarFor` ile aynıdır.
 */
export function TabScaffold({ tab, children }: { tab: TabKey; children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const notifications = useNotificationsQuery(user?.id);
  const today = zoneToday(deviceTimeZone());
  const unread = unreadCount(notifications.data ?? []);

  const header = headerFor(tab, {
    now: new Date(),
    user,
    activeCount: activeForTotals(subscriptions.data ?? [], today).length,
  });

  return (
    <View style={styles.screen}>
      <TopBar
        icon={header.icon}
        title={header.title}
        subtitle={header.subtitle}
        unreadCount={unread}
        onCalendar={() => router.push('/calendar')}
        onNotifications={() => router.push('/notifications')}
      />
      {children}
    </View>
  );
}

function headerFor(
  tab: TabKey,
  input: { now: Date; user: { displayName: string | null; email: string } | null; activeCount: number },
): { icon: IoniconName; title: string; subtitle?: string } {
  switch (tab) {
    case 'home':
      return { icon: 'home-outline', subtitle: homeDateLabel(input.now), title: greetingFor(input.user) };
    case 'subscriptions':
      return { icon: 'grid', subtitle: activeSubtitle(input.activeCount), title: 'Abonelikler' };
    case 'stats':
      return { icon: 'bar-chart', title: 'İstatistikler' };
    case 'settings':
      return { icon: 'settings-outline', title: 'Ayarlar' };
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
