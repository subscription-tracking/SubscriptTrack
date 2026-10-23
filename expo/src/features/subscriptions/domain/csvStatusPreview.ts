import type { ParseResult } from './csvImportParser';
import type { SubscriptionStatus } from './subscription';
import { canTransition } from './statusTransitions';

export function statusFallbackCounts(rows: ParseResult['rows']): Partial<Record<SubscriptionStatus, number>> {
  const counts: Partial<Record<SubscriptionStatus, number>> = {};
  for (const row of rows) {
    const createdStatus: SubscriptionStatus = row.trialEndDate ? 'trial' : 'active';
    if (row.status !== createdStatus && !canTransition(createdStatus, row.status)) {
      counts[createdStatus] = (counts[createdStatus] ?? 0) + 1;
    }
  }
  return counts;
}
