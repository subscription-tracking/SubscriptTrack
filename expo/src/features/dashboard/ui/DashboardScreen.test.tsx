import { Alert, RefreshControl } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DashboardScreen } from './DashboardScreen';
import { UpcomingTimeline } from './UpcomingTimeline';
import { Money } from '../../../core/domain/money';
import { subscriptionFromRow, type SubscriptionRow } from '../../subscriptions/domain/subscription';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockPaymentRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockRenew = jest.fn();
const mockPayments = jest.fn();
const mockOnline = jest.fn(() => true);
const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'x',
  name: 'Servis',
  amount: '50',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});
const overdueSub = subscriptionFromRow(row({ id: 'overdue-1', name: 'Eski Servis', amount: '100', next_renewal_date: '2026-10-10' }));
const upcomingSub = subscriptionFromRow(row({ id: 'up-1', name: 'Video Plus', next_renewal_date: '2026-10-15' }));
const trialSub = subscriptionFromRow(row({
  id: 'trial-1',
  name: 'Deneme Servis',
  amount: '0',
  status: 'trial',
  next_renewal_date: '2026-10-14',
  trial_end_date: '2026-10-14',
  trial_price_after: '30',
}));
const mockSubscriptions = [overdueSub, upcomingSub, trialSub];
const payment = (amount: string) => ({
  id: 'p1',
  subscriptionId: 'x',
  amount: Money.parse(amount),
  currency: 'TRY',
  paidAt: '2026-10-05T09:00:00Z',
  status: 'PAID' as const,
});
const ready = (data: unknown) => ({ data, isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });

it('aynı gün sonraki 20 kaydı altı satırla sınırlar ve tüm aboneliklere erişim sunar', () => {
  const onAll = jest.fn();
  const onOpen = jest.fn();
  const entries = Array.from({ length: 20 }, (_, i) => ({ kind: 'renewal' as const, subscription: subscriptionFromRow(row({ id: `later-${i}`, name: `Servis ${i}` })) }));
  render(<UpcomingTimeline days={[]} later={[{ date: { year: 2026, month: 10, day: 28 }, dayOffset: 15, entries }]} onOpen={onOpen} onAll={onAll} onCalendar={jest.fn()} />);
  expect(screen.getByText('Servis 5')).toBeTruthy();
  expect(screen.queryByText('Servis 6')).toBeNull();
  expect(screen.getAllByText('28')).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: /Servis 0, 28 Eki/ }));
  expect(onOpen).toHaveBeenCalledWith('later-0');
  fireEvent.press(screen.getByRole('link', { name: /Tümünü gör/ }));
  expect(onAll).toHaveBeenCalledTimes(1);
});

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user', displayName: 'Test', email: 'test@example.com' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../../stats/data/queries', () => ({ usePaymentsQuery: () => mockPayments() }));
jest.mock('../../subscriptions/ui/useRenewAction', () => ({ useRenewAction: () => ({ mutate: mockRenew, isPending: false, variables: undefined }) }));

beforeAll(() => {
  jest.useFakeTimers({ now: new Date('2026-10-13T09:00:00Z') });
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  mockPush.mockReset();
  mockNavigate.mockReset();
  mockRefetch.mockReset();
  mockPaymentRefetch.mockReset();
  mockRenew.mockReset();
  mockPayments.mockReset();
  mockOnline.mockReturnValue(true);
  mockPayments.mockReturnValue({ data: [], isPending: false, isError: false, refetch: mockPaymentRefetch });
  mockUseSubscriptionsQuery.mockReset();
  mockUseSubscriptionsQuery.mockReturnValue(ready(mockSubscriptions));
});

it('hero kalan tutarı, ödenen ve toplamı gösterir', () => {
  mockPayments.mockReturnValue({ data: [payment('30')] });
  render(<DashboardScreen />);

  expect(screen.getByText('Önümüzdeki 7 gün')).toBeTruthy();
  expect(screen.getByText(/Bu ay 1\/\d+ ödeme tamam · Kalan ₺150,00/)).toBeTruthy();
  expect(screen.queryByText('SubscriptTrack')).toBeNull();
});

it('hero kartı basılabilir ve İstatistikler ekranını açar', () => {
  render(<DashboardScreen />);

  fireEvent.press(screen.getByRole('button', { name: /^Bu ayın özeti, istatistikleri aç/ }));
  expect(mockNavigate).toHaveBeenCalledWith('/stats');
});

it('ödeme geçmişi yokken sıfır tutar yerine eksik veri durumunu gösterir', () => {
  mockPayments.mockReturnValue({ data: undefined, isError: true, refetch: mockPaymentRefetch });
  render(<DashboardScreen />);

  expect(screen.getByText('Ödeme özeti kullanılamıyor')).toBeTruthy();
  expect(screen.queryByText(/Ödenen.*0/)).toBeNull();
  expect(screen.getByRole('button', { name: /ödeme (gecikti|bekliyor)/ })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Ödeme özeti yüklenemedi, tekrar dene' }));
  expect(mockPaymentRefetch).toHaveBeenCalledTimes(1);
});

it('ödeme geçmişi yüklenirken hata veya sıfır tutar göstermez', () => {
  mockPayments.mockReturnValue({ data: undefined, isPending: true, isError: false });
  render(<DashboardScreen />);
  expect(screen.getByLabelText('Ödeme özeti yükleniyor')).toBeTruthy();
  expect(screen.queryByText('Ödeme özeti kullanılamıyor')).toBeNull();
  expect(screen.queryByText(/Ödenen.*0/)).toBeNull();
});

it('aktif abonelik yokken geçmiş yüklenemediyse boş veri varsaymaz', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([]));
  mockPayments.mockReturnValue({ data: undefined, isError: true, refetch: mockPaymentRefetch });
  render(<DashboardScreen />);
  expect(screen.getByText('Ödeme özeti kullanılamıyor')).toBeTruthy();
  expect(screen.queryByText('Aboneliklerin tek yerde')).toBeNull();
});

it('gecikmiş satır ve Ödendi onayı yenileme eylemini çalıştırır', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<DashboardScreen />);

  fireEvent.press(screen.getByRole('button', { name: /ödeme (gecikti|bekliyor)/ }));
  expect(screen.getByText(/3 gün gecikti/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Ödendi' }));

  expect(alertSpy).toHaveBeenCalledWith('Eski Servis ödendi mi?', expect.stringContaining('Yenileme tarihi'), expect.any(Array));
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  buttons.find((button) => button.text === 'Ödendi')?.onPress?.();
  expect(mockRenew).toHaveBeenCalledWith(expect.objectContaining({ id: 'overdue-1' }));
  alertSpy.mockRestore();
});

it('dikkat gerektiren yoksa bölüm çizilmez', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([upcomingSub]));
  render(<DashboardScreen />);

  expect(screen.queryByRole('button', { name: /ödeme (gecikti|bekliyor)/ })).toBeNull();
});

it('zaman çizelgesi günlere göre gruplanır ve Takvimi aç kısayolu çalışır', () => {
  render(<DashboardScreen />);

  expect(screen.getByText('Yaklaşan ödemeler')).toBeTruthy();
  expect(screen.getByText('Takvim ›')).toBeTruthy();
  expect(screen.getByText('15')).toBeTruthy();
  expect(screen.getByText(/Deneme bitiyor/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Takvim' }));
  expect(mockPush).toHaveBeenLastCalledWith('/calendar');
});

it('gün şeridinde bir güne dokununca liste o güne süzülür ve süzgeç kaldırılır', () => {
  render(<DashboardScreen />);
  fireEvent.press(screen.getAllByRole('button', { name: /, \d+ ödeme$/ })[0]);
  expect(screen.getByText('Seçili gün')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: /süzgecini kaldır/ }));
  expect(screen.getByText('Yaklaşan ödemeler')).toBeTruthy();
});

it('önümüzdeki 14 günde ödeme yoksa tek satır söyler', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([overdueSub]));
  render(<DashboardScreen />);

  expect(screen.getByText('Önümüzdeki 14 günde ödeme yok.')).toBeTruthy();
});

it('ana sayfada kategori dağılımı kartı yoktur', () => {
  render(<DashboardScreen />);
  expect(screen.queryByText('Tahmini aylık dağılım')).toBeNull();
  expect(screen.getAllByRole('button', { name: 'Takvim' })).toHaveLength(1);
});

it('çevrimdışı önbellek verisinin güncelliğini belirtir', () => {
  mockOnline.mockReturnValue(false);
  render(<DashboardScreen />);
  expect(screen.getByText(/gösterilen veriler güncel olmayabilir/)).toBeTruthy();
  expect(screen.getByText('Yaklaşan ödemeler')).toBeTruthy();
});

it('önbellek varsa yenileme hatasında veriyi ve uyarıyı birlikte gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ ...ready([upcomingSub]), isError: true });
  render(<DashboardScreen />);
  expect(screen.getByText(/gösterilen veriler güncel olmayabilir/)).toBeTruthy();
  expect(screen.getByText('Yaklaşan ödemeler')).toBeTruthy();
});

it('başlamamış abonelik varsa onboarding boş durumu göstermez', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([subscriptionFromRow(row({ id: 'future', start_date: '2026-11-01', next_renewal_date: '2026-11-01' }))]));
  render(<DashboardScreen />);
  expect(screen.queryByText('Aboneliklerin tek yerde')).toBeNull();
});

it('bugün vadeli kaydı gecikmiş diye nitelemez', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([subscriptionFromRow(row({ id: 'today', next_renewal_date: '2026-10-13' }))]));
  render(<DashboardScreen />);
  fireEvent.press(screen.getByRole('button', { name: /ödeme (gecikti|bekliyor)/ }));
  expect(screen.getByText(/Bugün yenileniyor/)).toBeTruthy();
  expect(screen.queryByText(/gün gecikti/)).toBeNull();
});

it('özet yüklenirken ilerleme durumunu gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, isRefetching: false, refetch: mockRefetch });

  render(<DashboardScreen />);

  expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
});

it('yükleme hatasında tekrar dene eylemini çalıştırır', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, isRefetching: false, refetch: mockRefetch });

  render(<DashboardScreen />);

  expect(screen.getByText('Özet yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it('hiç abonelik yokken başlangıç açıklamasını ve ekleme eylemini gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([]));

  render(<DashboardScreen />);

  expect(screen.getByText('Aboneliklerin tek yerde')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'İlk aboneliğini ekle' }));
  expect(mockPush).toHaveBeenCalledWith('/subscriptions/add');
});

it('yenileme hem abonelikleri hem ödeme geçmişini tekrar ister', () => {
  const view = render(<DashboardScreen />);
  fireEvent(view.UNSAFE_getByType(RefreshControl), 'refresh');
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(mockPaymentRefetch).toHaveBeenCalledTimes(1);
});

it('dolu ana sayfadan abonelik ekleme ekranına gider', () => {
  render(<DashboardScreen />);
  fireEvent.press(screen.getByRole('link', { name: '+ Abonelik ekle' }));
  expect(mockPush).toHaveBeenCalledWith('/subscriptions/add');
});

it('tüm ödemeler tamamlandığında sıfır kalan tutarı ve durumu gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([]));
  mockPayments.mockReturnValue({ data: [payment('30')], refetch: mockPaymentRefetch });
  render(<DashboardScreen />);
  expect(screen.getByText('Bu ay tüm ödemeler tamam')).toBeTruthy();
  expect(screen.getByText('₺0,00')).toBeTruthy();
});

it('birden fazla para birimini ayrı gösterir', () => {
  const usd = subscriptionFromRow(row({ id: 'usd', name: 'Dolar', currency: 'USD', amount: '5', next_renewal_date: '2026-10-15' }));
  mockUseSubscriptionsQuery.mockReturnValue(ready([upcomingSub, usd]));
  render(<DashboardScreen />);
  // Her para birimi başlıkta kendi satırında: hiçbiri küçük not olarak gizlenmez.
  expect(screen.getByText('USD')).toBeTruthy();
  expect(screen.getByText('TRY')).toBeTruthy();
  expect(screen.getAllByText(/₺50,00/).length).toBeGreaterThan(0);
});

it('bilinmeyen ödeme verisinde ilerleme oranı üretmez', () => {
  mockPayments.mockReturnValue({ data: undefined, isError: true, refetch: mockPaymentRefetch });
  render(<DashboardScreen />);
  expect(screen.queryByLabelText('Bu ay ödenen oran')).toBeNull();
});

it('özetin erişilebilir etiketi finansal değerleri içerir', () => {
  mockPayments.mockReturnValue({ data: [payment('30')], refetch: mockPaymentRefetch });
  render(<DashboardScreen />);
  expect(screen.getByRole('button', { name: /7 günde .*, Bu ay 1\/\d+ ödeme tamam · Kalan ₺150,00/ })).toBeTruthy();
});
