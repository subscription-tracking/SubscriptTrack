import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { CsvImportScreen } from './CsvImportScreen';
import { importSubscriptionRows } from '../data/csvImport';

const mockBack = jest.fn();
const mockGetDocumentAsync = jest.fn();
const mockFileText = jest.fn();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockSnackbarShow = jest.fn();
const mockOnline = jest.fn();

const HEADER = 'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after';
const VALID_ROW = 'Video Plus,49.90,TRY,monthly,2026-10-20,streaming,active,,,,';
const EXPIRED_ROW = 'Old Video Plus,49.90,TRY,monthly,2026-10-20,streaming,expired,,,,';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-document-picker', () => ({ getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args) }));
jest.mock('expo-file-system', () => ({ File: class { text = () => mockFileText(); } }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));
jest.mock('../data/queries', () => ({ subscriptionKeys: { all: (id: string) => ['subscriptions', id] } }));
jest.mock('../data/csvImport', () => ({ importSubscriptionRows: jest.fn() }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbarShow }) }));

describe('CsvImportScreen', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockGetDocumentAsync.mockReset();
    mockFileText.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockSnackbarShow.mockReset();
    mockOnline.mockReset();
    mockOnline.mockReturnValue(true);
    jest.mocked(importSubscriptionRows).mockReset();
    jest.mocked(importSubscriptionRows).mockResolvedValue({ created: 1, failures: [], warnings: [] });
  });

  it('örnek CSV şemasını gösterir', () => {
    render(<CsvImportScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Örnek format nasıl olmalı?' }));
    expect(screen.getByText('Örnek CSV formatı')).toBeTruthy();
    expect(screen.getByText(/Gerekli sütunlar: name, amount, currency, billing_cycle/)).toBeTruthy();
    expect(screen.getByText(new RegExp(HEADER))).toBeTruthy();
  });

  it('dosya seçimini iptal edince başlangıç ekranında kalır', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] });

    render(<CsvImportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'CSV dosyası seç' }));

    await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'CSV dosyası seç' })).toBeTruthy();
  });

  it('geçerli ve hatalı satırları önizler, çevrimdışıyken aktarımı kapatır', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://import.csv' }] });
    mockFileText.mockResolvedValue(`${HEADER}\n${VALID_ROW}\nBad,0,TRY,monthly,2026-10-20,streaming,active,,,,`);
    mockOnline.mockReturnValue(false);

    render(<CsvImportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'CSV dosyası seç' }));

    await waitFor(() => expect(screen.getByText('1 geçerli kayıt')).toBeTruthy());
    expect(screen.getByText('1 hatalı satır içe aktarılmayacak')).toBeTruthy();
    expect(screen.getByText('Video Plus')).toBeTruthy();
    expect(screen.getByText(/₺49,90/)).toBeTruthy();
    expect(screen.getByText('İçe aktarma için internet bağlantısı gerekir.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Geçerli kayıtları içe aktar' }).props.accessibilityState.disabled).toBe(true);
  });

  it('dosya okumada hata olursa bildirir', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://broken.csv' }] });
    mockFileText.mockRejectedValue(new Error('read failed'));

    render(<CsvImportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'CSV dosyası seç' }));

    await waitFor(() => expect(mockSnackbarShow).toHaveBeenCalledWith('Dosya okunamadı. Farklı bir dosya dene.', 'error'));
  });

  it('başarılı içe aktarmada önbelleği yeniler ve geri döner', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://import.csv' }] });
    mockFileText.mockResolvedValue(`${HEADER}\n${VALID_ROW}`);

    render(<CsvImportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'CSV dosyası seç' }));
    await waitFor(() => expect(screen.getByText('1 geçerli kayıt')).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'Geçerli kayıtları içe aktar' }));

    await waitFor(() => expect(importSubscriptionRows).toHaveBeenCalledTimes(1));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['subscriptions', 'test-user'] });
    expect(mockSnackbarShow).toHaveBeenCalledWith('1 abonelik içe aktarıldı.', 'primary');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('durum geçişi uygulanamayacak kaydı önceden ve aktarım sonucunda açıklar', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://expired.csv' }] });
    mockFileText.mockResolvedValue(`${HEADER}\n${EXPIRED_ROW}`);
    jest.mocked(importSubscriptionRows).mockResolvedValue({
      created: 1,
      failures: [],
      warnings: ['Satır 2: "Old Video Plus" eklendi; durum (expired) içe aktarılamadı.'],
    });

    render(<CsvImportScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'CSV dosyası seç' }));

    await waitFor(() => expect(screen.getByText('1 kayıt CSV\'deki durumunu koruyamayacak; Aktif olarak eklenecek.')).toBeTruthy());
    expect(screen.getByText(/Aylık · Süresi doldu/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Geçerli kayıtları içe aktar' }));

    await waitFor(() => expect(mockSnackbarShow).toHaveBeenCalledWith(
      '1 abonelik içe aktarıldı. 1 kaydın durumu korunamadı; ayrıntıyı önizlemede gördün.',
      'default',
    ));
  });

  it('başlangıç ekranında üç adımı ve örnek satırı gösterir', () => {
    render(<CsvImportScreen />);

    expect(screen.getByText('Dosyanı seç')).toBeTruthy();
    expect(screen.getByText('Önizlemeyi kontrol et')).toBeTruthy();
    expect(screen.getByText('İçe aktar')).toBeTruthy();
    expect(screen.getByText(/Netflix,149.99,TRY/)).toBeTruthy();
  });
});
