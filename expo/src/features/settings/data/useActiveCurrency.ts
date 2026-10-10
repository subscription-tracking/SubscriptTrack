import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ActiveCurrency, resolveActiveCurrency } from '../../../core/domain/activeCurrency';
import { useAuth } from '../../auth/AuthProvider';
import { readDeviceCurrency, writeDeviceCurrency } from '../../onboarding/data/currencyPreference';
import { fetchProfile, saveActiveCurrency } from './profileRepository';

const profileKey = (userId: string | undefined) => ['profile', userId ?? ''] as const;
const deviceKey = ['device-currency'] as const;

/**
 * Uygulamanın tek aktif para birimi. Profilde kayıtlı tercih varsa o, yoksa cihazdaki son seçim, o da yoksa
 * TRY. Tüm toplam, liste, grafik ve tasarruf ekranları bu değeri kullanır.
 */
export function useActiveCurrency(): ActiveCurrency {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: profileKey(user?.id),
    queryFn: () => fetchProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const device = useQuery({ queryKey: deviceKey, queryFn: readDeviceCurrency, staleTime: Infinity });
  const stored = profile.data?.currencyStored ? profile.data.preferredCurrency : null;
  return resolveActiveCurrency(stored, device.data);
}

/** Aktif para birimini değiştirir: cihazda ve (oturum varsa) profilde saklar; ilgili önbellek yenilenir. */
export function useSetActiveCurrency() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currency: ActiveCurrency) => {
      await writeDeviceCurrency(currency);
      if (user) await saveActiveCurrency(user.id, currency);
    },
    onSuccess: async (_result, currency) => {
      queryClient.setQueryData(deviceKey, currency);
      if (user) await queryClient.invalidateQueries({ queryKey: profileKey(user.id) });
    },
  });
}
