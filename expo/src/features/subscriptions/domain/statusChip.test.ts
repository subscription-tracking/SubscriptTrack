import { statusChipState } from './statusChip';

describe('statusChipState', () => {
  it('süresi dolan kayıt "Süresi doldu" etiketini hata tonuyla alır', () => {
    expect(statusChipState({ status: 'expired', isNotStarted: false, daysUntilRenewal: -3 })).toEqual({
      label: 'Süresi doldu',
      tone: 'error',
    });
  });

  it('aktif ve yenilemesi geçmiş kayıt gecikmiş sayılır', () => {
    expect(statusChipState({ status: 'active', isNotStarted: false, daysUntilRenewal: -1 }).label).toBe('Gecikmiş');
  });
});
