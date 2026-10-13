import { paymentStatusLabel } from './paymentStatusLabel';

describe('paymentStatusLabel', () => {
  it('ödenmiş kaydı "Ödendi" gösterir', () => {
    expect(paymentStatusLabel('PAID')).toBe('Ödendi');
  });
  it('ertelenmiş kaydı "Ertelendi" gösterir', () => {
    expect(paymentStatusLabel('DEFERRED')).toBe('Ertelendi');
  });
});
