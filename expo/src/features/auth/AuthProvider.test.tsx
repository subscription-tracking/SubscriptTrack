import { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { registerSessionCleaner } from '../../core/security/sessionCleanup';
import { AuthProvider, useAuth } from './AuthProvider';

let emit: (event: string, session: unknown) => void = () => undefined;
const mockRepoSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock('./data/authRepository', () => ({
  subscribeToAuthChanges: (listener: typeof emit) => { emit = listener; return () => undefined; },
  signOut: () => mockRepoSignOut(),
}));
jest.mock('../../shared/design/useThemeRevision', () => ({ useThemeRevision: () => 0 }));

const session = { user: { id: 'u1', email: 'a@b.c', user_metadata: {} } };
const probe: { signOut: ReturnType<typeof useAuth>['signOut'] } = { signOut: async () => undefined };
function Probe() {
  const auth = useAuth();
  useEffect(() => { probe.signOut = auth.signOut; });
  return <Text>{auth.user?.id ?? 'none'}</Text>;
}

async function signedIn() {
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  act(() => emit('SIGNED_IN', session));
  await waitFor(() => expect(view.getByText('u1')).toBeTruthy());
}

it('çıkışta kayıtlı temizleyiciler sign-out nedeniyle, oturum kapanmadan önce çalışır', async () => {
  const cleaner = jest.fn(async () => undefined);
  registerSessionCleaner('auth-test', cleaner);
  await signedIn();
  await act(async () => { await probe.signOut(); });
  expect(cleaner).toHaveBeenCalledWith('u1', 'sign-out');
  expect(mockRepoSignOut).toHaveBeenCalled();
});

it('hesap silmede account-deleted nedeniyle çalışır; temizleyici çökerse çıkış engellenmez', async () => {
  const cleaner = jest.fn(async () => { throw new Error('x'); });
  registerSessionCleaner('auth-test', cleaner);
  mockRepoSignOut.mockClear();
  await signedIn();
  await act(async () => { await probe.signOut({ accountDeleted: true }); });
  expect(cleaner).toHaveBeenCalledWith('u1', 'account-deleted');
  expect(mockRepoSignOut).toHaveBeenCalled();
});
