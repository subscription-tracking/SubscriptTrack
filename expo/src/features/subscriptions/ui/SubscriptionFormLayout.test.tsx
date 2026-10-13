import { fireEvent, render, screen } from '@testing-library/react-native';

import { SubscriptionFormScreen } from './SubscriptionFormScreen';
import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';

const mockMutate = jest.fn();
const mockCatalog: { name: string; category: 'streaming' }[] = [];

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/FontAwesome6', () => 'FontAwesome6');
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: mockMutate, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-idempotency-key' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({
  useActiveCurrency: () => 'TRY',
  useUserTimeZone: () => 'Europe/Istanbul',
}));
jest.mock('../data/queries', () => ({
  subscriptionKeys: { all: (userId: string) => ['subscriptions', userId] },
  useServiceCatalogQuery: () => ({ data: mockCatalog }),
  useSubscriptionsQuery: () => ({ data: [] }),
}));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../data/subscriptionMutations', () => ({ saveSubscriptionEdit: jest.fn(), submitCreate: jest.fn() }));
jest.mock('../data/subscriptionWriteRepository', () => ({ updateSubscription: jest.fn() }));
jest.mock('../../stats/data/paymentRepository', () => ({ recordDeferredPayment: jest.fn(), recordPayment: jest.fn() }));

describe('abonelik formu yeni düzen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockCatalog.length = 0;
  });

  it('yenileme sıklığı segmenti sonraki ödeme tarihini yeniden hesaplar', () => {
    render(<SubscriptionFormScreen initialStart="2026-01-15" />);
    const before = screen.getByLabelText(/^Sonraki ödeme:/).props.accessibilityLabel;
    fireEvent.press(screen.getByRole('radio', { name: 'Yıllık' }));
    expect(screen.getByLabelText(/^Sonraki ödeme:/).props.accessibilityLabel).not.toBe(before);
    expect(screen.getByText('Başlangıç tarihine göre otomatik hesaplandı.')).toBeTruthy();
  });

  it('deneme anahtarı alanları açar ve boşken doğrulama hatası verir', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.changeText(screen.getByLabelText('Servis'), 'Acme');
    fireEvent.changeText(screen.getByLabelText('Tutar'), '12.50');
    expect(screen.queryByLabelText('Deneme sonrası fiyat')).toBeNull();
    fireEvent(screen.getByRole('switch', { name: 'Ücretsiz deneme' }), 'valueChange', true);
    expect(screen.getByLabelText('Deneme sonrası fiyat')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Aboneliği kaydet' }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Deneme sonrası fiyat')).toBeTruthy();
  });

  it('maliyet özeti geçerli tutarda görünür, geçersizde gizlenir', () => {
    render(<SubscriptionFormScreen />);
    expect(screen.queryByText(/ \/ ay · Yılda /)).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Tutar'), '100');
    expect(screen.getByText('₺100,00 / ay · Yılda ₺1.200,00')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Tutar'), 'abc');
    expect(screen.queryByText(/ \/ ay · Yılda /)).toBeNull();
  });

  it('kategori ActionSheet ile değişir', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.press(screen.getByLabelText(/^Kategori:/));
    fireEvent.press(screen.getByRole('menuitem', { name: 'Müzik' }));
    expect(screen.getByLabelText('Kategori: Müzik')).toBeTruthy();
  });

  it('para birimi alt sayfadan seçilir', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.press(screen.getByLabelText('Para birimi: TRY'));
    fireEvent.press(screen.getByRole('menuitem', { name: 'EUR' }));
    expect(screen.getByLabelText('Para birimi: EUR')).toBeTruthy();
  });

  it('ödeme yöntemi satırı alanı açar', () => {
    render(<SubscriptionFormScreen />);
    expect(screen.getByLabelText('Ödeme yöntemi: Belirtilmedi')).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/^Ödeme yöntemi:/));
    fireEvent.changeText(screen.getByLabelText('Ödeme yöntemin'), 'Garanti');
    expect(screen.getByLabelText('Ödeme yöntemi: Garanti')).toBeTruthy();
  });

  it('ilk ödeme ertelendiğinde tarih alanı çıkar ve not sayacı görünür', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.press(screen.getByText('Daha fazla seçenek'));
    expect(screen.queryByLabelText(/^Ertelenen tarih:/)).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Ertelendi' }));
    expect(screen.getByLabelText(/^Ertelenen tarih:/)).toBeTruthy();
    expect(screen.getByText('0 / 2000')).toBeTruthy();
  });

  it('düzenlemede popüler servis ve ilk ödeme gizlidir', () => {
    mockCatalog.push({ name: 'Netflix', category: 'streaming' });
    const row = {
      id: 'e2', name: 'Spotify', amount: '50.00', currency: 'TRY', billing_cycle: 'monthly', category: 'music',
      status: 'active', start_date: '2026-01-01', next_renewal_date: '2026-10-20', payment_method: null, notes: null,
      website: null, trial_end_date: null, trial_price_after: null,
    } satisfies SubscriptionRow;
    render(<SubscriptionFormScreen editing={subscriptionFromRow(row)} />);
    expect(screen.queryByText('Hızlı seç')).toBeNull();
    expect(screen.getByRole('button', { name: 'Değişiklikleri kaydet' })).toBeTruthy();
    fireEvent.press(screen.getByText('Daha fazla seçenek'));
    expect(screen.queryByText('İlk ödeme')).toBeNull();
    expect(screen.getByText(/Elle seçildi/)).toBeTruthy();
  });
});
