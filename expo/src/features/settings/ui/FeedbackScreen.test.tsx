import { afterEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import { FeedbackScreen } from './FeedbackScreen';

const mockCreateTicket = jest.fn();
const mockShow = jest.fn();
const mockUseMutation = jest.fn();
type MutationConfig = { mutationFn: () => Promise<string>; onSuccess: () => void; onError: (error: Error) => void };

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@tanstack/react-query', () => ({ useMutation: (...args: unknown[]) => mockUseMutation(...args) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../data/supportRepository', () => ({ createSupportTicket: (...args: unknown[]) => mockCreateTicket(...args) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockShow }) }));

function renderScreen() {
  return render(<FeedbackScreen />);
}

describe('FeedbackScreen', () => {
  beforeEach(() => {
    mockCreateTicket.mockReset();
    mockShow.mockReset();
    mockUseMutation.mockReset();
    mockUseMutation.mockImplementation((untypedOptions: unknown) => {
      const options = untypedOptions as MutationConfig;
      return {
        isPending: false,
        mutate: () => { void options.mutationFn().then(options.onSuccess).catch(options.onError); },
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('boş mesajda paylaşımı kapatır ve destek gönderiminde alan doğrulamasını gösterir', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: 'Paylaşım ekranını aç' }).props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Destek kaydı oluştur' }));
    expect(screen.getByText('Mesajını yazmalısın')).toBeTruthy();
    expect(mockCreateTicket).not.toHaveBeenCalled();
  });

  it('destek kaydını seçilen kategori ve temizlenmiş mesajla gönderir', async () => {
    mockCreateTicket.mockResolvedValue('ticket-1');
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Mesajın'), '  Takvim filtresi önerisi  ');
    fireEvent.press(screen.getByRole('button', { name: 'Tür: Özellik isteği' }));
    fireEvent.press(screen.getByRole('button', { name: 'Hata bildirimi' }));
    fireEvent.press(screen.getByRole('button', { name: 'Destek kaydı oluştur' }));

    await waitFor(() => expect(mockCreateTicket).toHaveBeenCalledWith({ message: '  Takvim filtresi önerisi  ', category: 'Hata bildirimi' }));
    expect(mockShow).toHaveBeenCalledWith('Destek kaydı oluşturuldu.', 'primary');
    expect(screen.getByLabelText('Mesajın').props.value).toBe('');
  });

  it('destek servisi hata verirse hata mesajını gösterir', async () => {
    mockCreateTicket.mockRejectedValue(new Error('Destek kaydı oluşturulamadı. Tekrar dene.'));
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Mesajın'), 'Bir hata bildirimi');
    fireEvent.press(screen.getByRole('button', { name: 'Destek kaydı oluştur' }));

    await waitFor(() => expect(mockShow).toHaveBeenCalledWith('Destek kaydı oluşturulamadı. Tekrar dene.', 'error'));
  });

  it('paylaşım metnine kategori ve mesajı ekler', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Mesajın'), 'Bildirim saati seçimi');
    fireEvent.press(screen.getByRole('button', { name: 'Paylaşım ekranını aç' }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      message: 'SubscriptTrack Özellik isteği\n\nBildirim saati seçimi',
      title: 'SubscriptTrack geri bildirimi',
    }));
    share.mockRestore();
  });
});
