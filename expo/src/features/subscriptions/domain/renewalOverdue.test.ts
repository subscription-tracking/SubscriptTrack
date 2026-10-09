import { civilDate } from '../../../core/time/calendar';
import { renewalAdvancedEvent } from './subscriptionEdit';
import { advancedRenewalDate, isOverdueRenewal } from './renewalOverdue';
import { type SubscriptionRow, subscriptionFromRow } from './subscription';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'id',
  name: 'Ad',
  amount: '10',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: '2026-01-31',
  next_renewal_date: '2026-09-30',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

const today = civilDate(2026, 10, 9);

describe('isOverdueRenewal', () => {
  it('aktif kayıtta yenileme tarihi bugünden önceyse gecikmiştir', () => {
    expect(isOverdueRenewal(subscriptionFromRow(row({})), today)).toBe(true);
  });

  it('bugün yenileme günüyse gecikmiş değildir', () => {
    expect(isOverdueRenewal(subscriptionFromRow(row({ next_renewal_date: '2026-10-09' })), today)).toBe(false);
  });

  it('deneme kaydı da gecikebilir; duraklatılmış ve iptal edilmiş kayıtlar gecikmez', () => {
    expect(isOverdueRenewal(subscriptionFromRow(row({ status: 'trial' })), today)).toBe(true);
    expect(isOverdueRenewal(subscriptionFromRow(row({ status: 'paused' })), today)).toBe(false);
    expect(isOverdueRenewal(subscriptionFromRow(row({ status: 'cancelled' })), today)).toBe(false);
    expect(isOverdueRenewal(subscriptionFromRow(row({ is_archived: true })), today)).toBe(false);
  });

  it('yenileme tarihi boşsa gecikmiş değildir', () => {
    expect(isOverdueRenewal(subscriptionFromRow(row({ next_renewal_date: null })), today)).toBe(false);
  });
});

describe('advancedRenewalDate', () => {
  it('bugün veya sonrasındaki ilk döngü tarihini verir (faturalama günü 31: 30 Eylül → 31 Ekim)', () => {
    // Başlangıç 31 Ocak: 30 Eylül kırpılmış bir 31'dir; faturalama günü 31 kabul edilir.
    expect(advancedRenewalDate(subscriptionFromRow(row({})), today)).toEqual(civilDate(2026, 10, 31));
  });

  it('ay sonu kırpması olmayan kayıtta yenileme günü kullanılır (başlangıç günü değil)', () => {
    // Başlangıç 31 Ocak ama yenileme 15'i: yıllık döngüde 1 Haziran gibi tarih 31'e dönmez.
    const subscription = subscriptionFromRow(row({ billing_cycle: 'monthly', next_renewal_date: '2026-09-15' }));
    expect(advancedRenewalDate(subscription, today)).toEqual(civilDate(2026, 10, 15));
  });

  it('başlangıç gününü korur: 31 Ocak başlangıçlı aylık kayıt ay sonunda kırpılır, sonra 31e döner', () => {
    const subscription = subscriptionFromRow(row({ next_renewal_date: '2026-02-28' }));
    const next = advancedRenewalDate(subscription, civilDate(2026, 3, 15));
    expect(next).toEqual(civilDate(2026, 3, 31));
  });

  it('gecikmiş değilse null döner', () => {
    expect(advancedRenewalDate(subscriptionFromRow(row({ next_renewal_date: '2026-10-20' })), today)).toBeNull();
  });

  it('yıllık kayıt bir yıl ilerler', () => {
    const subscription = subscriptionFromRow(row({ billing_cycle: 'yearly', start_date: '2025-06-01', next_renewal_date: '2025-06-01' }));
    // 2026 Haziran hâlâ bugünden önce; ilk uygun döngü 2027 Haziran.
    expect(advancedRenewalDate(subscription, today)).toEqual(civilDate(2027, 6, 1));
  });
});

describe('renewalAdvancedEvent', () => {
  it('eski ve yeni tarihi payload olarak kaydeder', () => {
    expect(renewalAdvancedEvent(civilDate(2026, 9, 30), civilDate(2026, 10, 30))).toEqual({
      eventType: 'RENEWAL_ADVANCED',
      payload: { from_date: '2026-09-30', to_date: '2026-10-30' },
    });
  });

  it('tarih aynıysa olay üretmez', () => {
    expect(renewalAdvancedEvent(civilDate(2026, 10, 9), civilDate(2026, 10, 9))).toBeNull();
  });
});
