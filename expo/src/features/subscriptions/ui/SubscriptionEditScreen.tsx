import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useRouter } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { TextLink } from '../../../shared/widgets/TextLink';
import { useSubscriptionQuery } from '../data/queries';
import { type Subscription } from '../domain/subscription';
import { SubscriptionFormScreen } from './SubscriptionFormScreen';

/**
 * Düzenleme rotası: kaydı yükler, yüklenene kadar loading/error gösterir, kayıt yoksa
 * "artık mevcut değil" durumunu gösterir. Form yüklenen kayıtla başlar.
 */
export function SubscriptionEditScreen({ id }: { id: string }) {
  useThemeRevision();
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionQuery(user?.id, id);

  const state: AsyncState<Subscription> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Abonelik yüklenemedi. Tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : query.data
        ? { status: 'ready', data: query.data }
        : {
            status: 'empty',
            title: 'Bu abonelik artık mevcut değil',
            description: 'Aboneliği silinmiş ya da erişilemez olabilir.',
            action: <TextLink label="Listeye dön" onPress={() => router.back()} />,
          };

  return <AsyncStateView state={state}>{(subscription) => <SubscriptionFormScreen key={subscription.id} editing={subscription} />}</AsyncStateView>;
}
