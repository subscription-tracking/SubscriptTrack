import { fireEvent, render, screen } from '@testing-library/react-native';

import { SubscriptionEditScreen } from './SubscriptionEditScreen';

const mockBack = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionQuery = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../data/queries', () => ({ useSubscriptionQuery: (...args: unknown[]) => mockUseSubscriptionQuery(...args) }));
jest.mock('./SubscriptionFormScreen', () => ({ SubscriptionFormScreen: () => null }));

describe('SubscriptionEditScreen', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockRefetch.mockReset();
    mockUseSubscriptionQuery.mockReset();
  });

  it('abonelik yüklenirken ilerleme durumunu gösterir', () => {
    mockUseSubscriptionQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });

    render(<SubscriptionEditScreen id="missing-subscription" />);

    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('yükleme hatasında yeniden deneme sunar', () => {
    mockUseSubscriptionQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });

    render(<SubscriptionEditScreen id="subscription-1" />);

    expect(screen.getByText('Abonelik yüklenemedi. Tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('kayıt yoksa boş durumu ve listeye dönüş eylemini gösterir', () => {
    mockUseSubscriptionQuery.mockReturnValue({ isPending: false, isError: false, data: undefined, refetch: mockRefetch });

    render(<SubscriptionEditScreen id="deleted-subscription" />);

    expect(screen.getByText('Bu abonelik artık mevcut değil')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Listeye dön' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
