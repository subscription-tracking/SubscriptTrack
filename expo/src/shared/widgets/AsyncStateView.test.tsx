import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AsyncStateView, type AsyncState } from './AsyncStateView';

describe('AsyncStateView', () => {
  it('yükleniyor durumunda ilerleme göstergesini ve erişilebilir etiketi gösterir', () => {
    render(<AsyncStateView<string> state={{ status: 'loading' }}>{() => null}</AsyncStateView>);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('hata durumunda mesajı gösterir ve tekrar dene aksiyonunu çağırır', () => {
    const onRetry = jest.fn();
    render(
      <AsyncStateView<string>
        state={{ status: 'error', message: 'Ağ hatası', onRetry }}
      >
        {() => null}
      </AsyncStateView>,
    );
    expect(screen.getByText('Ağ hatası')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetry yoksa tekrar dene düğmesini göstermez', () => {
    render(
      <AsyncStateView<string> state={{ status: 'error', message: 'Hata' }}>{() => null}</AsyncStateView>,
    );
    expect(screen.queryByRole('button', { name: 'Tekrar dene' })).toBeNull();
  });

  it('boş durumda başlığı ve açıklamayı gösterir', () => {
    render(
      <AsyncStateView<string>
        state={{ status: 'empty', title: 'Henüz abonelik yok', description: 'İlkini ekle' }}
      >
        {() => null}
      </AsyncStateView>,
    );
    expect(screen.getByText('Henüz abonelik yok')).toBeTruthy();
    expect(screen.getByText('İlkini ekle')).toBeTruthy();
  });

  it('hazır durumda çocuk fonksiyonu veriyle çağırır', () => {
    const state: AsyncState<number> = { status: 'ready', data: 42 };
    render(<AsyncStateView state={state}>{(value) => <Text>{`değer: ${value}`}</Text>}</AsyncStateView>);
    expect(screen.getByText('değer: 42')).toBeTruthy();
  });
});
