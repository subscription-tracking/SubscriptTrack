import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getPermissionState, requestPermissionState } from './notificationScheduler';

/** İzin durumu sorgusu. İstek sonrası `refresh` ile yenilenir. */
export const permissionKey = ['notification-permission'] as const;

export function usePermissionQuery() {
  return useQuery({ queryKey: permissionKey, queryFn: getPermissionState, staleTime: 0 });
}

export function useRequestPermission() {
  const queryClient = useQueryClient();
  return async () => {
    const status = await requestPermissionState();
    queryClient.setQueryData(permissionKey, status);
    return status;
  };
}
