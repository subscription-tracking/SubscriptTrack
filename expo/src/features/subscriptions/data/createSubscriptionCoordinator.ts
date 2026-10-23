import { toCreatePayload, toSubscriptionFields, type SubscriptionFormValues, type CreateSubscriptionPayload } from '../domain/subscriptionForm';
import { DEFAULT_REMINDER_DAYS, rulesFromDays, sameDays } from '../domain/reminderRules';
import { formatCivilDate } from '../../../core/time/calendar';
import { paidAtFromCivil } from '../../stats/domain/paymentEvents';
import type { SubmitResult } from '../domain/subscriptionSyncTypes';
import type { UpdatePayload } from '../domain/subscriptionEdit';

export type CreateNotice = 'reminders_failed' | 'paid_failed' | 'deferred_failed' | 'paid_unavailable' | 'deferred_unavailable';
type FollowUpState = 'saved' | 'failed' | 'skipped' | 'unavailable' | 'queued';
export interface CreateOutcome {
  submission: SubmitResult;
  reminders: FollowUpState;
  payment: FollowUpState;
  notices: CreateNotice[];
}

interface InitialPaymentInput { idempotencyKey: string; subscriptionId: string; amount: string; currency: string; paidAt: Date }
export interface CreateWorkflowDependencies {
  now: () => Date;
  submitCreate: (userId: string, payload: CreateSubscriptionPayload, reminderRules?: { enabled: boolean; daysBefore: number }[]) => Promise<SubmitResult>;
  updateSubscription: (payload: UpdatePayload) => Promise<void>;
  recordPayment: (input: InitialPaymentInput) => Promise<void>;
  recordDeferredPayment: (input: InitialPaymentInput & { userId: string; deferredUntil: string }) => Promise<void>;
}

/** Oluşturma başarısı ile takip yazımlarının kısmi başarısını ayrı sonuçlandırır. */
export async function executeCreateSubscription(
  input: { userId: string; values: SubscriptionFormValues; timeZone: string; key: () => string },
  dependencies: CreateWorkflowDependencies,
): Promise<CreateOutcome> {
  const { userId, values, timeZone, key } = input;
  const customRules = !sameDays(values.reminderDays, DEFAULT_REMINDER_DAYS);
  const submission = await dependencies.submitCreate(userId, toCreatePayload(values, key()), customRules ? rulesFromDays(values.reminderDays) : undefined);
  const outcome: CreateOutcome = { submission, reminders: 'skipped', payment: 'skipped', notices: [] };
  const fields = toSubscriptionFields(values);
  if (customRules && submission.remindersManaged) outcome.reminders = submission.status === 'sent' ? 'saved' : 'queued';
  else if (customRules) {
    if (!submission.createdId) outcome.reminders = 'unavailable';
    else {
      try {
        await dependencies.updateSubscription({ p_idempotency_key: key(), p_subscription_id: submission.createdId,
          ...fields, p_notification_rules: rulesFromDays(values.reminderDays), p_status: values.isTrial ? 'trial' : 'active' });
        outcome.reminders = 'saved';
      } catch {
        outcome.reminders = 'failed';
        outcome.notices.push('reminders_failed');
      }
    }
  }
  if (values.initialPaymentStatus === 'unpaid') return outcome;
  const deferred = values.initialPaymentStatus === 'deferred';
  if (!submission.createdId) {
    outcome.payment = 'unavailable';
    outcome.notices.push(deferred ? 'deferred_unavailable' : 'paid_unavailable');
    return outcome;
  }
  try {
    const payment = { idempotencyKey: key(), subscriptionId: submission.createdId, amount: fields.p_amount, currency: fields.p_currency };
    if (deferred) await dependencies.recordDeferredPayment({ ...payment, userId, paidAt: dependencies.now(), deferredUntil: formatCivilDate(values.initialPaymentDate) });
    else await dependencies.recordPayment({ ...payment, paidAt: paidAtFromCivil(values.initialPaymentDate, timeZone) });
    outcome.payment = 'saved';
  } catch {
    outcome.payment = 'failed';
    outcome.notices.push(deferred ? 'deferred_failed' : 'paid_failed');
  }
  return outcome;
}
