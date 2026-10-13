import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { View } from 'react-native';
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
  const currency = useActiveCurrency();
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Takvim yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Takvim" />
      <AsyncStateView state={state}>{(subscriptions) => <CalendarMonth subscriptions={inCurrency(subscriptions, currency)} today={today} />}</AsyncStateView>
    </View>
  );
}

