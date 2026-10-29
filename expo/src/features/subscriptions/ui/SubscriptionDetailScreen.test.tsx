import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { Money } from '../../../core/domain/money';
import { type PaymentEvent } from '../../stats/domain/paymentEvents';
import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { SubscriptionDetailScreen } from './SubscriptionDetailScreen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionQuery = jest.fn();
const mockChange = jest.fn();
const mockRenew = jest.fn();
const mockConfirm = jest.fn();
let mockPayments: PaymentEvent[] = [];
let mockPaymentState = 'ready';
const mockPaymentRefetch = jest.fn();

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: View, Circle: View, Defs: View, LinearGradient: View, Rect: View, Stop: View };
});
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../core/clock/useCivilToday', () => ({ useCivilToday: () => ({ year: 2026, month: 10, day: 20 }) }));
jest.mock('../../notifications/data/notificationPermission', () => ({ usePermissionQuery: () => ({ data: 'granted' }) }));
jest.mock('../data/queries', () => ({ useSubscriptionQuery: (...args: unknown[]) => mockUseSubscriptionQuery(...args) }));
jest.mock('../../stats/data/queries', () => ({ usePaymentsQuery: () => ({ data: mockPaymentState === 'ready' ? mockPayments : undefined, isPending: mockPaymentState === 'loading', isError: mockPaymentState === 'error', refetch: mockPaymentRefetch }) }));
jest.mock('./useDeletionAction', () => ({ useDeletionAction: () => ({ confirm: mockConfirm, busy: false }) }));
jest.mock('./useRenewAction', () => ({ useRenewAction: () => ({ mutate: jest.fn(), isPending: false }) }));
jest.mock('./detail/useDetailMutations', () => ({
  useDetailMutations: () => ({ change: { mutate: mockChange }, renew: { mutate: mockRenew }, busy: false }),
}));

const baseRow: SubscriptionRow = {
  id: 'subscription-1',
  name: 'Video Plus',
  amount: '49.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-09-20',
  next_renewal_date: '2026-10-25',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
};

function open(overrides: Partial<SubscriptionRow> = {}) {
  mockUseSubscriptionQuery.mockReturnValue({
    isPending: false, isError: false, data: subscriptionFromRow({ ...baseRow, ...overrides }), refetch: mockRefetch,
  });
  return render(<SubscriptionDetailScreen id="subscription-1" />);
}

function payment(id: string, amount: string, status: PaymentEvent['status'] = 'PAID'): PaymentEvent {
  return { id, subscriptionId: 'subscription-1', amount: Money.parse(amount), currency: 'TRY', paidAt: '2026-10-01T09:00:00Z', status };
}

describe('SubscriptionDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayments = [];
    mockPaymentState = 'ready';
  });

  it('yükleniyor, yeniden denenebilir hata ve kayıt bulunamadı durumlarını işler', () => {
    mockUseSubscriptionQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });
    const loading = render(<SubscriptionDetailScreen id="subscription-1" />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseSubscriptionQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });
    render(<SubscriptionDetailScreen id="subscription-1" />);
    expect(screen.getByText('Abonelik yüklenemedi. Tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('kayıt bulunamadığında listeye döner', () => {
    mockUseSubscriptionQuery.mockReturnValue({ isPending: false, isError: false, data: undefined, refetch: mockRefetch });
    render(<SubscriptionDetailScreen id="missing" />);
    expect(screen.getByText('Bu abonelik artık mevcut değil')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Listeye dön' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('düzenleme, iptal ve ödeme geçmişi rotalarına doğru kimlikle gider', () => {
    mockPayments = [payment('p1', '49.90')];
    open();
    expect(screen.getByText('Video Plus')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Düzenle' }));
    expect(mockPush).toHaveBeenLastCalledWith('/subscriptions/subscription-1/edit');
    fireEvent.press(screen.getByRole('button', { name: 'Ödeme yöntemi: Belirtilmedi' }));
    expect(mockPush).toHaveBeenLastCalledWith('/subscriptions/subscription-1/edit');
    fireEvent.press(screen.getByRole('link', { name: 'Tümünü gör' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/stats/payments', params: { subscriptionId: 'subscription-1' } });
    fireEvent.press(screen.getByRole('button', { name: 'Nasıl iptal edilir?' }));
    expect(mockPush).toHaveBeenLastCalledWith('/subscriptions/subscription-1/cancel');
  });

  it('aktif kayıtta ⋯ menüsü duraklat, arşivle, iptal ettim ve yanlış kaydı sil satırlarını gösterir', () => {
    open();
    fireEvent.press(screen.getByRole('button', { name: 'Menü' }));
    for (const label of ['Duraklat', 'Arşivle', 'İptal ettim', 'Yanlış kaydı sil']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(label) })).toBeTruthy();
    }
    expect(screen.queryByRole('menuitem', { name: /Devam et/ })).toBeNull();
    fireEvent.press(screen.getByRole('menuitem', { name: /Duraklat/ }));
    expect(mockChange).toHaveBeenCalledWith('paused');
  });

  it('duraklatılmış kayıtta menü "Devam et" gösterir ve etkinleştirir', () => {
    open({ status: 'paused' });
    fireEvent.press(screen.getByRole('button', { name: 'Menü' }));
    expect(screen.queryByRole('menuitem', { name: /Duraklat/ })).toBeNull();
    fireEvent.press(screen.getByRole('menuitem', { name: /Devam et/ }));
    expect(mockChange).toHaveBeenCalledWith('active');
  });

  it('menüden iptal ettim iptal ekranına, yanlış kaydı sil silme onayına gider', () => {
    open();
    fireEvent.press(screen.getByRole('button', { name: 'Menü' }));
    fireEvent.press(screen.getByRole('menuitem', { name: /İptal ettim/ }));
    expect(mockPush).toHaveBeenLastCalledWith('/subscriptions/subscription-1/cancel');
    fireEvent.press(screen.getByRole('button', { name: 'Menü' }));
    fireEvent.press(screen.getByRole('menuitem', { name: /Yanlış kaydı sil/ }));
    expect(mockConfirm).toHaveBeenCalledWith(['subscription-1']);
  });

  it('iptalden yeniden etkinleştirme için onay almadan durumu değiştirmez', () => {
    open({ status: 'cancelled' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    fireEvent.press(screen.getByRole('button', { name: 'Menü' }));
    fireEvent.press(screen.getByRole('menuitem', { name: /Yeniden etkinleştir/ }));
    expect(mockChange).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Aboneliği yeniden etkinleştir', expect.stringContaining('Geçmiş tasarruf'), expect.any(Array));
    const actions = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    actions.find((action) => action.text === 'Yeniden etkinleştir')?.onPress?.();
    expect(mockChange).toHaveBeenCalledWith('active');
    alert.mockRestore();
  });

  it('vadesi gelmiş kayıtta ödeme ancak onaydan sonra bir kez kaydedilir', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    open({ next_renewal_date: '2026-10-20' });
    expect(screen.getByText('Bugün')).toBeTruthy();
    expect(screen.getByText(/sonraki tarih 20 Kasım 2026 olur/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Ödendi ve yenilendi' }));
    expect(mockRenew).not.toHaveBeenCalled();
    const actions = alert.mock.calls[0][2] ?? [];
    actions.find((action) => action.text === 'Ödendi')?.onPress?.();
    actions.find((action) => action.text === 'Ödendi')?.onPress?.();
    expect(mockRenew).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('gecikmiş vadede gerçek vadeyi ve tahmini sonraki döngüyü ayrı satırlarda gösterir', () => {
    open({ next_renewal_date: '2026-10-17' });
    expect(screen.getByText('3 gün gecikti')).toBeTruthy();
    expect(screen.getByText(/Sonraki döngü \(tahmini\): 17 Kasım 2026/)).toBeTruthy();
  });

  it('vadesi gelmemiş kayıtta yenileme düğmesi görünmez ve gün sayısı yazar', () => {
    open();
    expect(screen.queryByRole('button', { name: 'Ödendi ve yenilendi' })).toBeNull();
    expect(screen.getByText('5 gün kaldı')).toBeTruthy();
  });

  it('deneme bitişini gösterir, bilinmeyen ücret veya ödeme eylemi üretmez', () => {
    open({ status: 'trial', trial_end_date: '2026-10-22', trial_price_after: null, next_renewal_date: null });
    expect(screen.getByText('Ücretsiz deneme bitişi')).toBeTruthy();
    expect(screen.getByText('22 Ekim 2026')).toBeTruthy();
    expect(screen.getByText('Deneme sonrası ücret belirtilmedi')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ödendi ve yenilendi' })).toBeNull();
  });

  it('yıllık maliyeti ve şimdiye kadar ödenen toplamı gösterir', () => {
    mockPayments = [payment('p1', '49.90'), payment('p2', '49.90'), payment('p3', '49.90', 'DEFERRED')];
    open();
    expect(screen.getByLabelText('Tahmini yıllık maliyet: ₺598,80')).toBeTruthy();
    expect(screen.getByLabelText('Toplam ödenen: ₺99,80')).toBeTruthy();
    expect(screen.getAllByText('Ödendi')).toHaveLength(2);
    expect(screen.getByText('Ertelendi')).toBeTruthy();
  });

  it('ödeme yoksa toplam "—" ve boş mesaj gösterir', () => {
    open();
    expect(screen.getByLabelText('Toplam ödenen: —')).toBeTruthy();
    expect(screen.getByText('Henüz ödeme kaydı yok.')).toBeTruthy();
  });

  it('en çok üç son ödeme satırı gösterir', () => {
    mockPayments = [payment('a', '1'), payment('b', '2'), payment('c', '3'), payment('d', '4')];
    open();
    expect(screen.getAllByText('Ödendi')).toHaveLength(3);
  });

  it('son üç kaydı gelen sıra yerine ödeme tarihine ve eşit tarihte kimliğe göre seçer', () => {
    mockPayments = [
      { ...payment('old', '1'), paidAt: '2026-10-01T09:00:00Z' },
      { ...payment('z', '2'), paidAt: '2026-10-19T09:00:00Z' },
      { ...payment('a', '3'), paidAt: '2026-10-19T09:00:00Z' },
      { ...payment('new', '4'), paidAt: '2026-10-20T09:00:00Z' },
    ];
    open();
    expect(screen.queryByText('₺1,00')).toBeNull();
    expect(screen.getByText('₺4,00')).toBeTruthy();
    expect(screen.getByText('₺3,00')).toBeTruthy();
    expect(screen.getByText('₺2,00')).toBeTruthy();
  });

  it('ödeme sorgusu sürerken boş geçmiş veya sıfır toplam göstermez', () => {
    mockPaymentState = 'loading';
    open();
    expect(screen.getByText('Ödemeler yükleniyor…')).toBeTruthy();
    expect(screen.queryByText('Henüz ödeme kaydı yok.')).toBeNull();
    expect(screen.getByLabelText('Toplam ödenen: —')).toBeTruthy();
  });

  it('ödeme sorgusu hatasında tekrar yükleme sunar', () => {
    mockPaymentState = 'error';
    open();
    expect(screen.getByText('Ödeme geçmişi güncellenemedi.')).toBeTruthy();
    expect(screen.queryByText('Henüz ödeme kaydı yok.')).toBeNull();
    fireEvent.press(screen.getByRole('link', { name: 'Ödemeleri tekrar yükle' }));
    expect(mockPaymentRefetch).toHaveBeenCalledTimes(1);
  });

  it('uzun servis adını korur ve kart etiketini sunumda normalleştirir', () => {
    const name = 'Uzun isimli aile ve profesyonel video aboneliği';
    open({ name, payment_method: 'kart' });
    expect(screen.getByRole('header', { name })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ödeme yöntemi: Kart' })).toBeTruthy();
  });
});
