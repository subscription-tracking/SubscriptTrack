import { useNetworkState } from 'expo-network';

import { isOnline } from './networkState';

/** Çevrimiçi mi? İlk okumadan önce ve bilinmediğinde `true` döner. */
export function useOnlineStatus(): boolean {
  return isOnline(useNetworkState());
}
