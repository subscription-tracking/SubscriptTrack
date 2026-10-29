import { render, screen } from '@testing-library/react-native';

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
