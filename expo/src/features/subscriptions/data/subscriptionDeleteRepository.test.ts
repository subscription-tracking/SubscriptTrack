import { softDeleteSubscriptions } from './subscriptionDeleteRepository';
const mockRpc = jest.fn();
const mockEnv = { softDeletionEnabled: true };
jest.mock('../../../core/config/env', () => ({ get env() { return mockEnv; } }));
jest.mock('../../../core/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));
beforeEach(() => { mockRpc.mockReset(); mockEnv.softDeletionEnabled = true; });
const payload = { p_idempotency_key: 'delete-key', p_subscription_ids: ['record'] };
it('does not write before deployment and never falls back to physical delete', async () => {
  mockEnv.softDeletionEnabled = false;
  await expect(softDeleteSubscriptions(payload)).rejects.toMatchObject({ retryable: false });
  expect(mockRpc).not.toHaveBeenCalled();
});
it('sends the same key and IDs to the idempotent RPC', async () => {
  mockRpc.mockResolvedValue({ error: null });
  await softDeleteSubscriptions(payload);
  expect(mockRpc).toHaveBeenCalledWith('soft_delete_subscriptions_idempotent', payload);
});
it.each(['42501', 'PGRST202', '23505'])('reports permanent rejection %s', async (code) => {
  mockRpc.mockResolvedValue({ error: { code } });
  await expect(softDeleteSubscriptions(payload)).rejects.toMatchObject({ retryable: false });
});
it.each([undefined, '40001', '40P01', 'PGRST000'])('retains retryable failure %s', async (code) => {
  mockRpc.mockResolvedValue({ error: { code } });
  await expect(softDeleteSubscriptions(payload)).rejects.toMatchObject({ retryable: true });
});
