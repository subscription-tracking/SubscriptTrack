import { render, screen } from '@testing-library/react-native';

import { Money } from '../../../core/domain/money';
import { CategoryBarCard } from './CategoryBarCard';

const mockBar = jest.fn();
jest.mock('../../../shared/widgets/ProgressBar', () => ({
  StackedBar: (props: unknown) => { mockBar(props); return null; },
}));

it('aylık eşdeğeri tahmin olarak adlandırır ve tek kategoride grafik çizmez', () => {
  mockBar.mockClear();
  render(<CategoryBarCard totals={[{ group: 'Müzik', currency: 'TRY', amount: Money.parse('30'), count: 1 }]} onPress={jest.fn()} />);
  expect(screen.getByRole('button', { name: /Tahmini aylık dağılım, TRY\. Müzik: ₺30,00\. İstatistikleri aç/ })).toBeTruthy();
  expect(screen.getByText('₺30,00')).toBeTruthy();
  expect(mockBar).not.toHaveBeenCalled();
});

it('diğer para birimlerinin özete dahil edilmediğini belirtir', () => {
  render(<CategoryBarCard totals={[
    { group: 'Müzik', currency: 'TRY', amount: Money.parse('30'), count: 1 },
    { group: 'Eğlence', currency: 'USD', amount: Money.parse('10'), count: 1 },
  ]} onPress={jest.fn()} />);
  expect(screen.getByText('TRY; diğer para birimleri hariç')).toBeTruthy();
  expect(screen.getByRole('button', { name: /TRY; diğer para birimleri hariç\. Müzik: ₺30,00/ })).toBeTruthy();
  expect(screen.queryByText(/10,00/)).toBeNull();
});

it('kategori rengi tutar sıralaması değişince aynı kalır', () => {
  const totals = [
    { group: 'Müzik' as const, currency: 'TRY', amount: Money.parse('30'), count: 1 },
    { group: 'Eğlence' as const, currency: 'TRY', amount: Money.parse('40'), count: 1 },
  ];
  mockBar.mockClear();
  const view = render(<CategoryBarCard totals={totals} onPress={jest.fn()} />);
  const first = mockBar.mock.calls.at(-1)?.[0].segments as { key: string; color: string }[];
  view.rerender(<CategoryBarCard totals={[{ ...totals[0], amount: Money.parse('50') }, totals[1]]} onPress={jest.fn()} />);
  const second = mockBar.mock.calls.at(-1)?.[0].segments as { key: string; color: string }[];
  expect(first.map((item) => item.key)).not.toEqual(second.map((item) => item.key));
  expect(Object.fromEntries(first.map(({ key, color }) => [key, color]))).toEqual(Object.fromEntries(second.map(({ key, color }) => [key, color])));
});
