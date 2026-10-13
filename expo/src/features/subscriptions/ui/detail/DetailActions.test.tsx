import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../domain/subscription';
import { DetailActions } from './DetailActions';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../../core/time/calendar', () => ({
  ...jest.requireActual('../../../../core/time/calendar'),
  zoneToday: () => ({ year: 2026, month: 10, day: 9 }),
}));

const baseRow: SubscriptionRow = {
  id: 'sub-1',
  name: 'Video Plus',
  amount: '49.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-10-09',
  next_renewal_date: '2026-10-09',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
};

describe('DetailActions yenileme onayı', () => {
  it('vade bugün olduğunda kullanıcı onayı düğmesini gösterir', () => {
    const onRenew = jest.fn();
    render(
      <DetailActions
        subscription={subscriptionFromRow(baseRow)}
        busy={false}
        onChange={jest.fn()}
        onRenew={onRenew}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Ödendi ve yenilendi' }));
    expect(onRenew).toHaveBeenCalledTimes(1);
  });

  it('vade ilerideyse yenileme onayı düğmesini gizler', () => {
    render(
      <DetailActions
        subscription={subscriptionFromRow({ ...baseRow, next_renewal_date: '2026-10-10' })}
        busy={false}
        onChange={jest.fn()}
        onRenew={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Ödendi ve yenilendi' })).toBeNull();
  });

  it('iptal edilmiş kayıtta geçersiz duraklatma ve iptal düğmelerini gizler', () => {
    const onChange = jest.fn();
    render(<DetailActions subscription={subscriptionFromRow({ ...baseRow, status: 'cancelled' })}
      busy={false} onChange={onChange} onRenew={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Duraklat' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Aboneliği iptal et' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Yeniden Etkinleştir' }));
    expect(onChange).toHaveBeenCalledWith('active');
  });
});
