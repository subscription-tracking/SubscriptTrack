import { fireEvent, render, screen } from '@testing-library/react-native';

import { type CenterNotification } from '../data/notificationRepository';
import { NotificationRow } from './NotificationRow';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/FontAwesome6', () => 'FontAwesome6');

const item: CenterNotification = {
  id: 'notice-1',
  kind: 'renewal_today',
  subscriptionId: 'subscription-1',
  name: 'Video Plus',
  days: 0,
  createdAt: '2026-10-11T22:30:00.000Z',
  readAt: null,
};

const handlers = () => ({ onOpen: jest.fn(), onDismiss: jest.fn(), onMarkRead: jest.fn() });

describe('NotificationRow', () => {
  it('okunmamış durumu, gövdeyi ve tutarı etikette okur', () => {
    render(<NotificationRow item={item} read={false} amountText="₺99,90" {...handlers()} />);

    const row = screen.getByRole('button', { name: 'Video Plus, Bugün yenileniyor, ₺99,90, okunmamış' });
    expect(row.props.accessibilityHint).toBe('Okundu olarak işaretler ve abonelik ayrıntılarını açar.');
    expect(screen.getByText('Bugün yenileniyor · ₺99,90')).toBeTruthy();
  });

  it('okunmuşsa etikette okunmamış geçmez, okundu sayma eylemi sunmaz ve dokununca açar', () => {
    const onOpen = jest.fn();
    render(<NotificationRow item={item} read {...handlers()} onOpen={onOpen} />);

    const row = screen.getByRole('button', { name: 'Video Plus, Bugün yenileniyor' });
    expect(row.props.accessibilityActions).toEqual([{ name: 'dismiss', label: 'Kapat' }]);
    fireEvent.press(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('ekran okuyucu kullanıcısı kaydırmadan kapatır ve okundu sayar', () => {
    const { onDismiss, onMarkRead, onOpen } = handlers();
    render(<NotificationRow item={item} read={false} onOpen={onOpen} onDismiss={onDismiss} onMarkRead={onMarkRead} />);

    const row = screen.getByRole('button', { name: /Video Plus/ });
    expect(row.props.accessibilityActions).toEqual([
      { name: 'dismiss', label: 'Kapat' },
      { name: 'markRead', label: 'Okundu say' },
    ]);
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'markRead' } });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onMarkRead).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('tekrar sayısı varsa ×N rozetini gösterir', () => {
    render(<NotificationRow item={item} read count={4} {...handlers()} />);

    expect(screen.getByText('×4')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Video Plus, Bugün yenileniyor, 4 kez' })).toBeTruthy();
  });

  it('Ödendi işlem sürerken pasiftir; basınca onPay çağrılır', () => {
    const onPay = jest.fn();
    const view = render(<NotificationRow item={item} read actions={{ canPay: true }} onPay={onPay} {...handlers()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Ödendi' }));
    expect(onPay).toHaveBeenCalledTimes(1);
    view.unmount();

    render(<NotificationRow item={item} read actions={{ canPay: true }} paying onPay={onPay} {...handlers()} />);
    expect(screen.getByRole('button', { name: 'Ödendi' }).props.accessibilityState).toMatchObject({ disabled: true });
  });
});
