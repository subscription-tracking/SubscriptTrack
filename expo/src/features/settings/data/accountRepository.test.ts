import { FunctionsHttpError } from '@supabase/supabase-js';

import { requestAccountDeletion } from './accountRepository';

const mockInvoke = jest.fn();
jest.mock('../../../core/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
}));

beforeEach(() => mockInvoke.mockReset());

it('confirms deletion only when the server explicitly reports success', async () => {
  mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  await expect(requestAccountDeletion()).resolves.toBeUndefined();
  expect(mockInvoke).toHaveBeenCalledWith('delete-account', { method: 'POST' });
});

it.each([null, {}, { success: false }])('does not report an incomplete deletion as success', async (data) => {
  mockInvoke.mockResolvedValue({ data, error: null });
  await expect(requestAccountDeletion()).rejects.toMatchObject({ recentLoginRequired: false });
});

it('distinguishes a recent-login failure from other service failures', async () => {
  mockInvoke.mockResolvedValueOnce({ data: null, error: new FunctionsHttpError({ status: 403 } as Response) });
  await expect(requestAccountDeletion()).rejects.toMatchObject({ recentLoginRequired: true });
  mockInvoke.mockResolvedValueOnce({ data: null, error: new FunctionsHttpError({ status: 500 } as Response) });
  await expect(requestAccountDeletion()).rejects.toMatchObject({ recentLoginRequired: false });
});

it('treats a non-HTTP failure with a status-like field as a generic failure', async () => {
  mockInvoke.mockResolvedValueOnce({ data: null, error: { context: { status: 403 } } });
  await expect(requestAccountDeletion()).rejects.toMatchObject({ recentLoginRequired: false });
});
