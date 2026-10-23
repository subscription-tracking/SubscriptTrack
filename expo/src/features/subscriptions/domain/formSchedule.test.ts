import { civilDate } from '../../../core/time/calendar';
import { automaticFormDate, changeFormField } from './formSchedule';
import type { SubscriptionFormValues } from './subscriptionForm';

describe('automatic form schedule', () => {
  const today = civilDate(2026, 10, 12);
  it('past start uses the first strictly future anchored cycle', () => {
    expect(automaticFormDate({ startDate: civilDate(2025, 1, 31), billingCycle: 'monthly' }, today)).toEqual(civilDate(2026, 10, 31));
  });
  it('future and today start are the first due date', () => {
    expect(automaticFormDate({ startDate: today, billingCycle: 'weekly' }, today)).toEqual(today);
    expect(automaticFormDate({ startDate: civilDate(2026, 11, 20), billingCycle: 'yearly' }, today)).toEqual(civilDate(2026, 11, 20));
  });
  it('keeps 31 anchor after a short month and crosses leap years', () => {
    expect(automaticFormDate({ startDate: civilDate(2027, 1, 31), billingCycle: 'monthly' }, civilDate(2027, 2, 28))).toEqual(civilDate(2027, 3, 31));
    expect(automaticFormDate({ startDate: civilDate(2028, 2, 29), billingCycle: 'yearly' }, civilDate(2029, 2, 27))).toEqual(civilDate(2029, 2, 28));
  });
  it('keeps a manual override until start or period changes', () => {
    const values = { startDate: civilDate(2026, 1, 31), nextRenewalDate: civilDate(2026, 12, 5), billingCycle: 'monthly', notes: '' } as SubscriptionFormValues;
    expect(changeFormField(values, 'notes', 'keep manual', today).nextRenewalDate).toEqual(civilDate(2026, 12, 5));
    expect(changeFormField(values, 'billingCycle', 'quarterly', today).nextRenewalDate).toEqual(civilDate(2026, 10, 31));
    expect(changeFormField(values, 'startDate', civilDate(2026, 10, 20), today).nextRenewalDate).toEqual(civilDate(2026, 10, 20));
  });
});

// Senaryo 14 ve 15: periyot veya başlangıç tarihi değişince sonraki ödeme tarihi formda yeniden hesaplanır.
describe('düzenlemede periyot ve başlangıç değişimi (senaryo 14, 15)', () => {
  const today = civilDate(2026, 10, 12);
  const base = {
    name: 'Plan', amount: '10.00', currency: 'TRY', billingCycle: 'monthly', category: 'software',
    startDate: civilDate(2026, 1, 15), nextRenewalDate: civilDate(2026, 10, 15), notes: '', paymentMethod: '',
    isTrial: false, trialEndDate: null, trialPrice: '', initialPaymentStatus: 'unpaid', initialPaymentDate: today,
    reminderDays: [], scheduleMode: 'manual',
  } as unknown as SubscriptionFormValues;

  it('aylıktan yıllığa çevirince sonraki ödeme, başlangıçtan sonraki ilk yıllık döngüye taşınır', () => {
    const next = changeFormField(base, 'billingCycle', 'yearly', today);
    expect(next.nextRenewalDate).toEqual(civilDate(2027, 1, 15));
  });

  it('başlangıç tarihi gelecekte ise sonraki ödeme tam olarak o tarihtir', () => {
    const next = changeFormField(base, 'startDate', civilDate(2026, 12, 5), today);
    expect(next.nextRenewalDate).toEqual(civilDate(2026, 12, 5));
  });
});
