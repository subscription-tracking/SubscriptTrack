import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { ExportScreen } from './ExportScreen';
import { shareCsvFile } from '../data/exportFile';
import { buildSubscriptionCsv } from '../domain/csvExport';

const mockUseSubscriptionsQuery = jest.fn();
const mockRefetch = jest.fn();
const mockSnackbarShow = jest.fn();

const statuses = ['active', 'trial', 'paused', 'cancelled', 'expired', 'archived'] as const;
const subscriptions = statuses.map((status, index) => subscriptionFromRow({
  id: `subscription-${status}`,
  name: `Service ${status}`,
  amount: `${index + 1}.00`,
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'software',
  status,
  start_date: '2026-01-01',
  next_renewal_date: status === 'archived' || status === 'expired' ? null : '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: status === 'trial' ? '2026-10-15' : null,
  trial_price_after: status === 'trial' ? '8.00' : null,
} satisfies SubscriptionRow));

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../data/exportFile', () => ({ shareCsvFile: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../data/cloudExportRepository', () => ({ requestCloudExport: jest.fn() }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbarShow }) }));

describe('ExportScreen', () => {
  beforeEach(() => {
    mockUseSubscriptionsQuery.mockReset();
    mockRefetch.mockReset();
    mockSnackbarShow.mockReset();
    jest.mocked(shareCsvFile).mockReset();
    jest.mocked(shareCsvFile).mockResolvedValue(undefined);
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: subscriptions, refetch: mockRefetch });
  });

  it('yükleniyor ve tekrar denenebilir hata durumlarını gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });
    const loading = render(<ExportScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });
    render(<ExportScreen />);
    expect(screen.getByText('Abonelikler yüklenemedi.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('boş hesapta cihaz dosyası paylaşımını kapatır ve sıfır kayıt gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });

    render(<ExportScreen />);

    expect(screen.getByText('0 abonelik; dışa aktarılan dosya tekrar içe aktarılabilir.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dosya olarak paylaş' }).props.accessibilityState.disabled).toBe(true);
  });

  it('cihaz CSV paylaşımına altı abonelik durumunun tümünü ve kullanıcı IANA bölgesini verir', async () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: subscriptions, refetch: mockRefetch });

    render(<ExportScreen />);
    expect(screen.getByText('6 abonelik; dışa aktarılan dosya tekrar içe aktarılabilir.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Dosya olarak paylaş' }));

    await waitFor(() => expect(shareCsvFile).toHaveBeenCalledTimes(1));
    const [csv, zone] = jest.mocked(shareCsvFile).mock.calls[0] ?? [];
    expect(zone).toBe('Europe/Istanbul');
    for (const status of statuses) expect(csv).toContain(`"${status}"`);
    expect(csv).toBe(buildSubscriptionCsv(subscriptions));
  });

  it('dosya paylaşımı başarısızsa kullanıcıya hatayı gösterir', async () => {
    jest.mocked(shareCsvFile).mockRejectedValueOnce(new Error('Bu cihazda paylaşım kullanılamıyor.'));

    render(<ExportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Dosya olarak paylaş' }));

    await waitFor(() => expect(mockSnackbarShow).toHaveBeenCalledWith('Bu cihazda paylaşım kullanılamıyor.', 'error'));
  });

  it('her seçenek altında gizlilik açıklamasını çelişmeden gösterir', () => {
    render(<ExportScreen />);

    expect(screen.getByText('Nasıl çalışır: Dosya cihazında oluşturulur, sunucuya yüklenmez.')).toBeTruthy();
    expect(screen.getByText('Nasıl çalışır: Dosya sunucuya yüklenir ve 1 saat geçerli bir bağlantıyla paylaşılır.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bulut bağlantısı oluştur' })).toBeTruthy();
  });
});
