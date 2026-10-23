import { env } from '../../../core/config/env';
import { recordPayment } from '../../stats/data/paymentRepository';
import { resolveRows, submitOperation } from './subscriptionSync';
import { SubscriptionWriteError } from './subscriptionWriteRepository';
import { confirmAtomicRenewal } from './renewalRepository';
import { createSubscriptionMutations } from './subscriptionMutationCoordinator';

export { createSubscriptionMutations } from './subscriptionMutationCoordinator';
const mutations = createSubscriptionMutations({
  resolveRows, submitOperation, recordPayment, confirmAtomicRenewal,
  atomicRenewalEnabled: () => env.atomicRenewalEnabled, now: () => new Date(),
  writeError: (message) => new SubscriptionWriteError(message),
});
export const { submitCreate, saveSubscriptionEdit, changeSubscriptionStatus, confirmOverdueRenewal } = mutations;
