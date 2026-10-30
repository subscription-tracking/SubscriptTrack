import { fireEvent, render, screen } from '@testing-library/react-native';

import { civilDate } from '../../../core/time/calendar';
import { colors } from '../../../shared/design/tokens';
import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { SubscriptionTile } from './SubscriptionTile';

const trial = subscriptionFromRow({
  id: 'sub-1',
  name: 'Video Plus',
  amount: '129.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'trial',
  start_date: '2026-09-01',
  next_renewal_date: '2026-10-05',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: '2026-10-05',
  trial_price_after: null,
} satisfies SubscriptionRow);

describe('SubscriptionTile accessibility', () => {
  it('announces category, cycle, amount, status and trial end date', () => {
    render(<SubscriptionTile subscription={trial} today={civilDate(2026, 10, 1)} onPress={jest.fn()} />);

    expect(screen.getByRole('button', {
      name: 'Video Plus, Video ve dizi, Aylık, ₺129,90, Deneme, Deneme bitişi 5 Ekim 2026',
    })).toBeTruthy();
  });
});

describe('SubscriptionTile süresi dolan kayıt', () => {
  it('Süresi doldu etiketi ve çip gösterir, kimlikle çağrılır', () => {
    const onPress = jest.fn();
    const expired = { ...trial, status: 'expired' as const };
    render(<SubscriptionTile subscription={expired} today={civilDate(2026, 10, 10)} onPress={onPress} />);

    expect(screen.getAllByText('Süresi doldu').length).toBeGreaterThanOrEqual(1);
    fireEvent.press(screen.getByRole('button', { name: /Süresi doldu/ }));
    expect(onPress).toHaveBeenCalledWith('sub-1');
  });
});

describe('SubscriptionTile gecikmiş vade', () => {
  it('gecikmiş vadeyi alt metinde ve Gecikti çipiyle gösterir', () => {
    const overdue = { ...trial, status: 'active' as const, nextRenewalDate: civilDate(2026, 10, 6) };
    render(<SubscriptionTile subscription={overdue} today={civilDate(2026, 10, 9)} onPress={jest.fn()} />);

    expect(screen.getByText('Aylık · 3 gün gecikti')).toBeTruthy();
    expect(screen.getByText('Gecikti')).toBeTruthy();
    expect(screen.queryByText(/Sonraki döngü/)).toBeNull();
  });

  it('gelecek ve gecikmiş durumlarını farklı semantik renklerle gösterir', () => {
    const active = { ...trial, status: 'active' as const };
    const view = render(<SubscriptionTile subscription={{ ...active, nextRenewalDate: civilDate(2026, 10, 10) }} today={civilDate(2026, 10, 9)} onPress={jest.fn()} />);
    expect(screen.getByText(/Aylık · Yarın/).props.style.color).toBe(colors.onSurfaceVariant);
    view.rerender(<SubscriptionTile subscription={{ ...active, nextRenewalDate: civilDate(2026, 10, 6) }} today={civilDate(2026, 10, 9)} onPress={jest.fn()} />);
    expect(screen.getByText(/3 gün gecikti/).props.style.color).toBe(colors.error);
  });
});
