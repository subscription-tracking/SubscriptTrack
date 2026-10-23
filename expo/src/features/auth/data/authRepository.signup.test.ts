import { signUp } from './authRepository';

const mockSignUp = jest.fn();
jest.mock('../../../core/supabase/client', () => ({
  supabase: { auth: { signUp: (...args: unknown[]) => mockSignUp(...args) } },
}));
jest.mock('expo-linking', () => ({ createURL: () => 'subscripttrack://auth-callback' }));

beforeEach(() => mockSignUp.mockReset());

it('gerçek kayıt ile boş kimlikli mevcut adres için aynı sonucu döner', async () => {
  mockSignUp.mockResolvedValueOnce({ data: { user: { id: 'new', identities: [{}] }, session: null }, error: null });
  const fresh = await signUp('new@example.com', 'password123');
  mockSignUp.mockResolvedValueOnce({ data: { user: { id: 'hidden', identities: [] }, session: null }, error: null });
  const existing = await signUp('existing@example.com', 'password123');
  expect(fresh).toEqual({ requiresEmailConfirmation: true });
  expect(existing).toEqual(fresh);
});

it('açık kayıtlı adres hatasını aynı genel sonuca çevirir', async () => {
  mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: new Error('User already registered') });
  await expect(signUp('old@example.com', 'password123')).resolves.toEqual({ requiresEmailConfirmation: true });
});

it('başka kayıt hatalarını göstermeye devam eder', async () => {
  mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: new Error('Network unavailable') });
  await expect(signUp('new@example.com', 'password123')).rejects.toThrow('Bağlantı hatası');
});
