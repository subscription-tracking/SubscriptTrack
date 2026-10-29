import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { Text, View } from 'react-native';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { textStyle } from '../../../shared/design/typography';
import { colors, spacing } from '../../../shared/design/tokens';
import { TextLink } from '../../../shared/widgets/TextLink';
import { useAuth } from '../../auth/AuthProvider';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import type { Subscription } from '../../subscriptions/domain/subscription';
import { inCurrency } from '../../subscriptions/domain/currencyFilter';
import { useActiveCurrency, useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { CalendarMonth } from './CalendarMonth';
import { styles } from './calendarStyles';

export { formatDateParam } from '../domain/calendarDateParam';

export function CalendarScreen() {
  useThemeRevision();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const online = useOnlineStatus();
  const currency = useActiveCurrency();
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError && query.data === undefined
      ? {
          status: 'error',
          message: 'Takvim yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Takvim" />
      {query.data !== undefined && (!online || query.isError) ? <View style={{ paddingHorizontal: spacing.lg }}><Text accessibilityLiveRegion="polite" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Takvim verileri güncel olmayabilir.</Text><TextLink label="Tekrar dene" onPress={() => void query.refetch()} /></View> : null}
      <AsyncStateView state={state}>{(subscriptions) => <CalendarMonth subscriptions={inCurrency(subscriptions, currency)} today={today} />}</AsyncStateView>
    </View>
  );
}

