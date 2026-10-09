import { renewalLabel } from './renewalLabel';

describe('renewalLabel', () => {
  it.each([
    [-1, 'Süresi doldu'],
    [0, 'Bugün yenileniyor'],
    [1, 'Yarın yenileniyor'],
    [3, '3 gün sonra'],
    [7, '7 gün sonra'],
    [14, '2 hafta sonra'],
    [21, '3 hafta sonra'],
    [30, '4 hafta sonra'],
    [60, '2 ay sonra'],
    [365, '12 ay sonra'],
  ])('%i gün → %s', (days, expected) => {
    expect(renewalLabel(days)).toBe(expected);
  });
});
