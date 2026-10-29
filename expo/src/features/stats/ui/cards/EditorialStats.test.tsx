import { fireEvent, render, screen } from '@testing-library/react-native';

import { Money } from '../../../../core/domain/money';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';
import { TrendCard } from './TrendCard';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../../../shared/widgets/useGrowIn', () => ({ useGrowIn: (count: number) => Array.from({ length: count }, () => ({ interpolate: () => '100%' })) }));

it('tek kategoriyi tutarla gösterir, karşılaştırma çubuğu ve yüzde üretmez', () => {
  render(<CategoryBreakdownCard entries={[{ category: 'music', monthly: Money.parse('100') }]} total={Money.parse('100')} currency="TRY" />);
  expect(screen.getByText('Müzik')).toBeTruthy();
  expect(screen.getByText('₺100,00')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.queryByText('%100')).toBeNull();
});

it('iki kategori varsa dağılım çubuklarını korur', () => {
  render(<CategoryBreakdownCard entries={[{ category: 'music', monthly: Money.parse('40') }, { category: 'streaming', monthly: Money.parse('60') }]} total={Money.parse('100')} currency="TRY" />);
  expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  expect(screen.getByText('%40')).toBeTruthy();
});

it('ödeme geçmişi yoksa tahmini tutarı gösterir ancak sahte geçmiş grafiği çizmez', () => {
  render(<TrendCard trend={[]} currency="TRY" months={6} hasPaymentHistory={false} monthly={Money.parse('100')} now={new Date('2026-10-13T09:00:00Z')} timeZone="Europe/Istanbul" onMonthsChanged={jest.fn()} />);
  expect(screen.getByText('Aylık gider tahmini')).toBeTruthy();
  expect(screen.getByText('₺100,00')).toBeTruthy();
  expect(screen.queryByLabelText('Grafik dönemi')).toBeNull();
  expect(screen.getByText(/Geçmiş ödemeleri görüntülemek/)).toBeTruthy();
});

it('ay seçimi ve dönem değişiminde doğru ay ve toplamı gösterir', () => {
  const onMonthsChanged = jest.fn();
  const props = { currency: 'TRY', hasPaymentHistory: true, monthly: Money.parse('100'), now: new Date('2026-10-13T09:00:00Z'), timeZone: 'Europe/Istanbul', onMonthsChanged };
  const view = render(<TrendCard {...props} trend={[100, 0, 300]} months={3} />);
  fireEvent.press(screen.getByRole('button', { name: 'Ağu, ₺1,00' }));
  expect(screen.getByRole('button', { name: 'Ağu, ₺1,00' }).props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText(/Ağu kayıtlı ödeme ₺1,00/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Eyl: ödeme yok' })).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: '6 ay' }));
  expect(onMonthsChanged).toHaveBeenCalledWith(6);
  view.rerender(<TrendCard {...props} trend={[0, 0, 0, 100, 0, 300]} months={6} />);
  expect(screen.getByLabelText(/Eki kayıtlı ödeme ₺3,00/)).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: '12 ay' }));
  expect(onMonthsChanged).toHaveBeenCalledWith(12);
  view.rerender(<TrendCard {...props} trend={[0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 0, 300]} months={12} />);
  expect(screen.getByLabelText(/Eki kayıtlı ödeme ₺3,00/)).toBeTruthy();
});
