import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { AddPaymentDialog } from './PaymentDialogs';

const row: SubscriptionRow = {
  id: 'sub-1',
  name: 'Test aboneliği',
  amount: '12.50',
  currency: 'USD',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-11-01',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
};

const subscription = subscriptionFromRow(row);

describe('AddPaymentDialog', () => {
  it('abonelikler dialog açıldıktan sonra gelirse varsayılan tutarı doldurur', () => {
    const view = render(
      <AddPaymentDialog visible subscriptions={[]} onClose={jest.fn()} onSave={jest.fn()} />,
    );

    view.rerender(
      <AddPaymentDialog visible subscriptions={[subscription]} onClose={jest.fn()} onSave={jest.fn()} />,
    );

    expect(screen.getByLabelText('Tutar (USD)').props.value).toBe('12.50');
  });

  it('yeniden açıldığında önceki tutar girişini temizler', () => {
    const view = render(
      <AddPaymentDialog visible subscriptions={[subscription]} onClose={jest.fn()} onSave={jest.fn()} />,
    );
    const amount = screen.getByLabelText('Tutar (USD)');
    fireEvent.changeText(amount, '99.00');

    view.rerender(
      <AddPaymentDialog visible={false} subscriptions={[subscription]} onClose={jest.fn()} onSave={jest.fn()} />,
    );
    view.rerender(
      <AddPaymentDialog visible subscriptions={[subscription]} onClose={jest.fn()} onSave={jest.fn()} />,
    );

    expect(screen.getByLabelText('Tutar (USD)').props.value).toBe('12.50');
  });
});
