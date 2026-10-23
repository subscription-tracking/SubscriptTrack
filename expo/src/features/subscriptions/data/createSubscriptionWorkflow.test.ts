import { executeCreateSubscription as createSubscriptionWorkflow } from './createSubscriptionCoordinator';
import { civilDate } from '../../../core/time/calendar';
import type { SubscriptionFormValues } from '../domain/subscriptionForm';


const values: SubscriptionFormValues = { name: 'Plan', amount: '10', currency: 'TRY', billingCycle: 'monthly', category: 'software',
  startDate: civilDate(2026, 10, 12), nextRenewalDate: civilDate(2026, 11, 12), notes: '', paymentMethod: '',
  isTrial: false, trialEndDate: null, trialPrice: '', initialPaymentStatus: 'paid', initialPaymentDate: civilDate(2026, 10, 12), reminderDays: [1] };
const dependencies = () => ({ now: () => new Date('2026-10-12T10:00:00Z'), submitCreate: jest.fn().mockResolvedValue({ status: 'sent', eventSaved: true, createdId: 'new-id' }),
  updateSubscription: jest.fn().mockResolvedValue(undefined), recordPayment: jest.fn().mockResolvedValue(undefined),
  recordDeferredPayment: jest.fn().mockResolvedValue(undefined) });
const input = { userId: 'user', values, timeZone: 'Europe/Istanbul', key: () => 'key' };

it('returns each successful follow-up separately', async () => {
  const deps = dependencies();
  expect(await createSubscriptionWorkflow(input, deps)).toMatchObject({ reminders: 'saved', payment: 'saved', notices: [] });
  expect(deps.recordPayment).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'new-id', amount: '10.00' }));
});
it('preserves creation success when both follow-up writes fail', async () => {
  const deps = dependencies();
  deps.updateSubscription.mockRejectedValue(new Error('network'));
  deps.recordPayment.mockRejectedValue(new Error('network'));
  const outcome = await createSubscriptionWorkflow(input, deps);
  expect(outcome).toMatchObject({ submission: { createdId: 'new-id' }, reminders: 'failed', payment: 'failed' });
  expect(outcome.notices).toHaveLength(2);
});
it('does not send follow-ups for queued creation', async () => {
  const deps = dependencies();
  deps.submitCreate.mockResolvedValue({ status: 'queued', eventSaved: false });
  expect(await createSubscriptionWorkflow(input, deps)).toMatchObject({ reminders: 'unavailable', payment: 'unavailable' });
  expect(deps.recordPayment).not.toHaveBeenCalled();
  expect(deps.updateSubscription).not.toHaveBeenCalled();
});
it('propagates creation failure without executing follow-ups', async () => {
  const deps = dependencies();
  deps.submitCreate.mockRejectedValue(new Error('quota'));
  await expect(createSubscriptionWorkflow(input, deps)).rejects.toThrow('quota');
  expect(deps.updateSubscription).not.toHaveBeenCalled();
});

it('records deferred payment without using the paid payment path', async () => {
  const deps = dependencies();
  const outcome = await createSubscriptionWorkflow({ ...input, values: { ...values, initialPaymentStatus: 'deferred' } }, deps);
  expect(outcome.payment).toBe('saved');
  expect(deps.recordDeferredPayment).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user', deferredUntil: '2026-10-12' }));
  expect(deps.recordPayment).not.toHaveBeenCalled();
});

it('retains custom reminders in the durable offline creation contract', async () => {
  const deps = dependencies();
  deps.submitCreate.mockResolvedValue({ status: 'queued', eventSaved: false, remindersManaged: true });
  const outcome = await createSubscriptionWorkflow({ ...input, values: { ...values, initialPaymentStatus: 'unpaid' } }, deps);
  expect(outcome.reminders).toBe('queued');
  expect(deps.submitCreate).toHaveBeenCalledWith('user', expect.any(Object), [{ daysBefore: 1, enabled: true }]);
  expect(deps.updateSubscription).not.toHaveBeenCalled();
});
