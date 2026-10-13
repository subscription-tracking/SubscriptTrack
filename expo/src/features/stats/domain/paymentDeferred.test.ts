import { paymentFromRow, totalForMonth } from './paymentEvents';

const row = (status: string | null | undefined, paid_at: string) => ({
  id: `p-${status ?? 'none'}-${paid_at}`,
  subscription_id: 's',
  amount: '100',
  currency: 'TRY',
  paid_at,
  status,
});

describe('ertelenen ödeme', () => {
  const now = new Date('2026-10-15T09:00:00.000Z');

  it('durum yoksa ödenmiş sayılır', () => {
    expect(paymentFromRow(row(undefined, '2026-10-05T09:00:00Z')).status).toBe('PAID');
  });

  it('ertelenen kayıt aylık toplama girmez', () => {
    const events = [
      paymentFromRow(row('PAID', '2026-10-05T09:00:00Z')),
      paymentFromRow(row('DEFERRED', '2026-10-06T09:00:00Z')),
    ];
    expect(totalForMonth(events, 'TRY', now, 'Europe/Istanbul')).toBe(10000);
  });
});
