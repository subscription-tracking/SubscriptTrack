import { submitCreate } from './subscriptionMutations';
import { updateSubscription } from './subscriptionWriteRepository';
import { recordDeferredPayment, recordPayment } from '../../stats/data/paymentRepository';
import { executeCreateSubscription, type CreateWorkflowDependencies } from './createSubscriptionCoordinator';

export type { CreateNotice, CreateOutcome } from './createSubscriptionCoordinator';
export function createSubscriptionWorkflow(
  input: Parameters<typeof executeCreateSubscription>[0],
  dependencies: CreateWorkflowDependencies = { submitCreate, updateSubscription, recordDeferredPayment, recordPayment, now: () => new Date() },
) {
  return executeCreateSubscription(input, dependencies);
}
