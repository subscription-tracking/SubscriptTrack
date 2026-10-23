import { loadPrefs, savePrefs } from './notificationPrefs';
import { readJson, writeJson } from '../../../core/storage/secureJsonStore';
import { supabase } from '../../../core/supabase/client';
import { fetchProfile } from '../../settings/data/profileRepository';

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJson: jest.fn(), writeJson: jest.fn() }));
jest.mock('../../../core/supabase/client', () => ({
  supabase: { auth: { getUser: jest.fn(), updateUser: jest.fn() }, from: jest.fn() },
}));
jest.mock('../../settings/data/profileRepository', () => ({ fetchProfile: jest.fn() }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const read = jest.mocked(readJson);
const write = jest.mocked(writeJson);
const getUser = jest.mocked(supabase.auth.getUser);
const updateUser = jest.mocked(supabase.auth.updateUser);
const profile = jest.mocked(fetchProfile);
const from = jest.mocked(supabase.from);

beforeEach(() => {
  jest.resetAllMocks();
  read.mockResolvedValue({ enabled: true, defaultDays: 7, reminderHour: 8 });
  write.mockResolvedValue(undefined);
  profile.mockResolvedValue({
    firstName: '', lastName: '', preferredCurrency: 'TRY', currencyStored: true,
    timezone: 'Europe/Istanbul', defaultNotifyDays: 3, notificationsEnabled: false,
  });
  getUser.mockResolvedValue({ data: { user: { id: 'user-1', user_metadata: { reminder_hour: 10 } } }, error: null } as unknown as Awaited<ReturnType<typeof getUser>>);
});

it('uzaktaki üç hesap tercihini alır ve kullanıcıya ayrılmış cache yazdırır', async () => {
  expect(await loadPrefs('user-1')).toEqual({ enabled: false, defaultDays: 3, reminderHour: 10 });
  expect(read).toHaveBeenCalledWith('notifications.prefs.user-1');
  expect(write).toHaveBeenCalledWith('notifications.prefs.user-1', { enabled: false, defaultDays: 3, reminderHour: 10 });
});

it('çevrimdışıyken yalnız aynı kullanıcıya ait son tercihleri kullanır', async () => {
  profile.mockRejectedValue(new Error('offline'));
  expect(await loadPrefs('user-1')).toEqual({ enabled: true, defaultDays: 7, reminderHour: 8 });
  expect(read).toHaveBeenCalledWith('notifications.prefs.user-1');
});

it('oturum başka kullanıcıya aitse yerel tercihleri döndürmez', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null } as unknown as Awaited<ReturnType<typeof getUser>>);
  await expect(loadPrefs('user-1')).rejects.toThrow('Oturum değişti');
});

it('profil ve Auth meta verisine hesap tercihlerini yazar', async () => {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  from.mockReturnValue({ upsert } as unknown as ReturnType<typeof from>);
  updateUser.mockResolvedValue({ data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof updateUser>>);
  await savePrefs('user-1', { enabled: false, defaultDays: 1, reminderHour: 11 });
  expect(upsert).toHaveBeenCalledWith({ user_id: 'user-1', push_enabled: false, default_notify_days: 1 }, { onConflict: 'user_id' });
  expect(updateUser).toHaveBeenCalledWith({ data: { reminder_hour: 11 } });
  expect(write).toHaveBeenCalledWith('notifications.prefs.user-1', { enabled: false, defaultDays: 1, reminderHour: 11 });
  expect(getUser).toHaveBeenCalledTimes(2);
});

it('başka kullanıcı oturumu varsa hiçbir hesaba tercih yazmaz', async () => {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  from.mockReturnValue({ upsert } as unknown as ReturnType<typeof from>);
  getUser.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null } as unknown as Awaited<ReturnType<typeof getUser>>);

  await expect(savePrefs('user-1', { enabled: false, defaultDays: 1, reminderHour: 11 })).rejects.toThrow('Oturum değişti');

  expect(upsert).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});

it('profil yazımından sonra hesap değişirse Auth tercihlerini yeni hesaba yazmaz', async () => {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  from.mockReturnValue({ upsert } as unknown as ReturnType<typeof from>);
  getUser
    .mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null } as unknown as Awaited<ReturnType<typeof getUser>>)
    .mockResolvedValueOnce({ data: { user: { id: 'user-2' } }, error: null } as unknown as Awaited<ReturnType<typeof getUser>>);

  await expect(savePrefs('user-1', { enabled: false, defaultDays: 1, reminderHour: 11 })).rejects.toThrow('Oturum değişti');

  expect(upsert).toHaveBeenCalledTimes(1);
  expect(updateUser).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
