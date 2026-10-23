import { createSubscriptionMutations, type SubscriptionMutationDependencies } from './subscriptionMutationCoordinator';
import { rowFromCreate } from '../domain/subscriptionOperations';

const row = { ...rowFromCreate({ p_idempotency_key: 'create-key', p_name: 'Plan', p_amount: '10.00', p_currency: 'TRY',
  p_billing_cycle: 'monthly', p_category: 'software', p_start_date: '2026-10-01', p_next_renewal_date: '2026-10-12',
  p_notes: null, p_payment_method: null, p_trial_end_date: null, p_trial_price_after: null }), id: 'sub' };
function setup(atomic: boolean) {
  const dependencies: SubscriptionMutationDependencies = {
    resolveRows: async () => [row], submitOperation: jest.fn(async () => ({ status: 'sent' as const, eventSaved: true })),
    recordPayment: jest.fn(async () => undefined), confirmAtomicRenewal: jest.fn(async () => undefined),
    atomicRenewalEnabled: () => atomic, now: () => new Date('2026-10-12T10:00:00Z'), writeError: (message) => new Error(message),
  };
  return { dependencies, mutations: createSubscriptionMutations(dependencies) };
}
const input = { userId: 'user', subscriptionId: 'sub', today: { year: 2026, month: 10, day: 12 }, idempotencyKey: 'renewal-key' };

it('selects the injected atomic path without separate payment or queue writes', async () => {
  const test = setup(true);
  await test.mutations.confirmOverdueRenewal(input);
  expect(test.dependencies.confirmAtomicRenewal).toHaveBeenCalledWith(input, expect.objectContaining({ id: 'sub' }), { year: 2026, month: 11, day: 12 }, input.today);
  expect(test.dependencies.recordPayment).not.toHaveBeenCalled();
  expect(test.dependencies.submitOperation).not.toHaveBeenCalled();
});

it('preserves the fallback ordering and operation key using injected dependencies', async () => {
  const test = setup(false);
  await test.mutations.confirmOverdueRenewal(input);
  expect(test.dependencies.recordPayment).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'renewal-key', paidAt: new Date('2026-10-12T10:00:00Z') }));
  expect(jest.mocked(test.dependencies.recordPayment).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(test.dependencies.submitOperation).mock.invocationCallOrder[0]);
});

it('rejects an invalid status transition before sending any operation', async () => {
  const test = setup(false);
  await expect(test.mutations.changeSubscriptionStatus({ userId: 'user', subscriptionId: 'sub', to: 'trial', idempotencyKey: 'key' })).rejects.toThrow('durum değişikliği');
  expect(test.dependencies.submitOperation).not.toHaveBeenCalled();
});
