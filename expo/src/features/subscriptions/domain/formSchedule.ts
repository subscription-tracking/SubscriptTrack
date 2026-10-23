import { addDays, dayNumber, nextOccurrenceOnOrAfter, type CivilDate } from '../../../core/time/calendar';
import type { SubscriptionFormValues } from './subscriptionForm';

export type ScheduleMode = 'automatic' | 'manual';

export function automaticFormDate(values: Pick<SubscriptionFormValues, 'startDate' | 'billingCycle'>, today: CivilDate): CivilDate {
  return dayNumber(values.startDate) >= dayNumber(today)
    ? values.startDate
    : nextOccurrenceOnOrAfter(values.startDate, values.billingCycle, addDays(today, 1));
}

export function changeFormField<K extends keyof SubscriptionFormValues>(
  values: SubscriptionFormValues, key: K, value: SubscriptionFormValues[K], today: CivilDate,
): SubscriptionFormValues {
  const next = { ...values, [key]: value };
  return key === 'startDate' || key === 'billingCycle'
    ? { ...next, nextRenewalDate: automaticFormDate(next, today) }
    : next;
}
