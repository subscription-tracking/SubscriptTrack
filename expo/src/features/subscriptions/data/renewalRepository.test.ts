import { confirmAtomicRenewal } from './renewalRepository';
const mockRpc = jest.fn();
const mockEnv = { timezoneModeEnabled: false };
jest.mock('../../../core/config/env', () => ({ get env() { return mockEnv; } }));
jest.mock('../../../core/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));
const today = { year: 2026, month: 10, day: 12 };
const current = { id: 'sub', nextRenewalDate: today };
const next = { year: 2026, month: 11, day: 12 };
beforeEach(() => { mockRpc.mockReset(); mockRpc.mockResolvedValue({ error: null }); });
it.each([false, true])('preserves old RPC or selects timezone-aware contract: %s', async (enabled) => {
  mockEnv.timezoneModeEnabled = enabled;
  await confirmAtomicRenewal({ idempotencyKey: 'same-key', timeZone: 'Europe/Istanbul' }, current, next, today);
  expect(mockRpc).toHaveBeenCalledWith(enabled ? 'confirm_subscription_renewal_in_timezone_idempotent' : 'confirm_subscription_renewal_idempotent', {
    p_idempotency_key: 'same-key', p_subscription_id: 'sub', p_expected_old_date: '2026-10-12', p_next_date: '2026-11-12', p_today: '2026-10-12',
    ...(enabled ? { p_timezone: 'Europe/Istanbul' } : {}),
  });
});
it.each(['P0001', '23505', '42501'])('propagates rejection %s without payment fallback', async (code) => {
  mockRpc.mockResolvedValue({ error: { code } });
  await expect(confirmAtomicRenewal({ idempotencyKey: 'same-key' }, current, next, today)).rejects.toThrow();
  expect(mockRpc).toHaveBeenCalledTimes(1);
});
