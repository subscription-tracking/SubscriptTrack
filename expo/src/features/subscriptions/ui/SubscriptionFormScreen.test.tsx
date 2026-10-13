import { fireEvent, render, screen } from '@testing-library/react-native';

import { SubscriptionFormScreen } from './SubscriptionFormScreen';
import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';

const mockMutate = jest.fn();
const mockShow = jest.fn();
const mockBack = jest.fn();
const mockCatalog: { name: string; category: 'streaming' }[] = [];
const mockExisting: { name: string }[] = [];

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
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
  useSubscriptionsQuery: () => ({ data: mockExisting }),
}));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockShow }) }));
jest.mock('../data/subscriptionMutations', () => ({ saveSubscriptionEdit: jest.fn(), submitCreate: jest.fn() }));
jest.mock('../data/subscriptionWriteRepository', () => ({ updateSubscription: jest.fn() }));
jest.mock('../../stats/data/paymentRepository', () => ({ recordDeferredPayment: jest.fn(), recordPayment: jest.fn() }));

describe('SubscriptionFormScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockShow.mockReset();
    mockBack.mockReset();
    mockCatalog.length = 0;
    mockExisting.length = 0;
  });

  it('yeni abonelik için aktif para birimi ve temel alanları gösterir', () => {
    render(<SubscriptionFormScreen />);

    expect(screen.getByText('Yeni abonelik')).toBeTruthy();
    expect(screen.getByLabelText('Servis')).toBeTruthy();
    expect(screen.getByLabelText('Tutar')).toBeTruthy();
    expect(screen.getByText('TRY')).toBeTruthy();
    expect(screen.getByText('Ne sıklıkla yenileniyor?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aboneliği kaydet' })).toBeTruthy();
  });

  it('boş zorunlu alanları gösterir ve geçersiz formu kaydetmez', () => {
    render(<SubscriptionFormScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Aboneliği kaydet' }));

    expect(screen.getByText('Ad boş olamaz')).toBeTruthy();
    expect(screen.getByText('Tutar gir')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('geçerli servis ve tutar girilince kaydetme mutasyonunu başlatır', () => {
    render(<SubscriptionFormScreen />);

    fireEvent.changeText(screen.getByLabelText('Servis'), 'Acme');
    fireEvent.changeText(screen.getByLabelText('Tutar'), '12.50');
    fireEvent.press(screen.getByRole('button', { name: 'Aboneliği kaydet' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
  it('double tap starts only one submission even before mutation state updates', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.changeText(screen.getByLabelText('Servis'), 'Same name');
    fireEvent.changeText(screen.getByLabelText('Tutar'), '12.50');
    const button = screen.getByRole('button', { name: 'Aboneliği kaydet' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('popüler servis seçimini servis alanına ve kategoriye uygular', () => {
    mockCatalog.push({ name: 'Netflix', category: 'streaming' });
    render(<SubscriptionFormScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Netflix' }));

    expect(screen.getByLabelText('Servis').props.value).toBe('Netflix');
  });
});

// Senaryo 51: fiyat alanı sayısal/ondalıklı klavye açar.
describe('fiyat klavyesi (senaryo 51)', () => {
  it('tutar alanı decimal-pad klavye tipini kullanır', () => {
    render(<SubscriptionFormScreen />);
    expect(screen.getByLabelText('Tutar').props.keyboardType).toBe('decimal-pad');
  });
});

// Senaryo 17: düzenlemede değişiklik yapılıp kaydedilmeden geri dönülürse kayıt yazılmaz.
describe('düzenlemeyi kaydetmeden çıkma (senaryo 17)', () => {
  const row = {
    id: 'edit-1', name: 'Netflix', amount: '15.00', currency: 'TRY', billing_cycle: 'monthly', category: 'streaming',
    status: 'active', start_date: '2026-01-01', next_renewal_date: '2026-10-20', payment_method: null, notes: null,
    website: null, trial_end_date: null, trial_price_after: null,
  } satisfies SubscriptionRow;

  it('değişikliği yazmadan geri döner', () => {
    render(<SubscriptionFormScreen editing={subscriptionFromRow(row)} />);
    fireEvent.changeText(screen.getByLabelText('Servis'), 'Netflix Premium');
    fireEvent.press(screen.getByLabelText('Geri'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
  it('kapalı "Daha fazla seçenek" bölümündeki hatada bölümü açar ve özet gösterir', () => {
    render(<SubscriptionFormScreen />);
    fireEvent.changeText(screen.getByLabelText('Servis'), 'Acme');
    fireEvent.changeText(screen.getByLabelText('Tutar'), '12.50');
    fireEvent.press(screen.getByText('Daha fazla seçenek'));
    fireEvent.changeText(screen.getByLabelText('Notlar (isteğe bağlı)'), 'x'.repeat(2001));
    fireEvent.press(screen.getByText('Daha az seçenek'));
    expect(screen.queryByLabelText('Notlar (isteğe bağlı)')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Aboneliği kaydet' }));

    expect(screen.getByLabelText('Notlar (isteğe bağlı)')).toBeTruthy();
    expect(mockShow).toHaveBeenCalledWith('Ayrıntılarda düzeltilecek alan var', 'error');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('aynı isimde kayıt varsa engellemeden bilgi uyarısı gösterir', () => {
    mockExisting.push({ name: 'Netflix' });
    render(<SubscriptionFormScreen />);
    fireEvent.changeText(screen.getByLabelText('Servis'), '  netflix ');
    expect(screen.getByText('Aynı isimde bir abonelik zaten var; yine de kaydedebilirsin.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Tutar'), '12.50');
    fireEvent.press(screen.getByRole('button', { name: 'Aboneliği kaydet' }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
