import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { setAppLocked } from '../../core/security/lockState';
import { ActionSheet, type ActionSheetItem } from './ActionSheet';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));

afterEach(() => act(() => setAppLocked(false)));

function items(onPress = jest.fn(), onDelete = jest.fn()): ActionSheetItem[] {
  return [
    { key: 'pause', label: 'Duraklat', icon: 'pause-circle-outline', hint: 'Kayıt listede kalır', onPress },
    { key: 'delete', label: 'Yanlış kaydı sil', icon: 'delete-outline', tone: 'danger', onPress: onDelete },
  ];
}

describe('ActionSheet', () => {
  it('görünürken başlığı ve satırları gösterir, gizliyken göstermez', () => {
    const view = render(<ActionSheet visible title="Video Plus" items={items()} onClose={jest.fn()} />);
    expect(screen.getByText('Video Plus')).toBeTruthy();
    expect(screen.getByText('Kayıt listede kalır')).toBeTruthy();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    view.rerender(<ActionSheet visible={false} title="Video Plus" items={items()} onClose={jest.fn()} />);
    expect(screen.queryByText('Video Plus')).toBeNull();
  });

  it('satıra basınca önce sayfayı kapatır, sonra eylemi çalıştırır', () => {
    const order: string[] = [];
    const onClose = jest.fn(() => order.push('close'));
    const onPress = jest.fn(() => order.push('press'));
    render(<ActionSheet visible title="Video Plus" items={items(onPress)} onClose={onClose} />);
    fireEvent.press(screen.getByRole('menuitem', { name: /Duraklat/ }));
    expect(order).toEqual(['close', 'press']);
  });

  it('yıkıcı satır da çalışır; pasif satır çalışmaz', () => {
    const onDelete = jest.fn();
    const list = items(jest.fn(), onDelete);
    list[0] = { ...list[0], disabled: true };
    const onPause = jest.fn();
    list[0].onPress = onPause;
    render(<ActionSheet visible title="Video Plus" items={list} onClose={jest.fn()} />);
    fireEvent.press(screen.getByRole('menuitem', { name: /Duraklat/ }));
    expect(onPause).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('menuitem', { name: /Yanlış kaydı sil/ }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('arka plana basınca kapanır', () => {
    const onClose = jest.fn();
    render(<ActionSheet visible title="Video Plus" items={items()} onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Menüyü kapat', { hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uygulama kilitlenince kapanır, kilit açılınca geri gelir', () => {
    const view = render(<ActionSheet visible title="Video Plus" items={items()} onClose={jest.fn()} />);
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);
    act(() => setAppLocked(true));
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
    act(() => setAppLocked(false));
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);
  });
});
