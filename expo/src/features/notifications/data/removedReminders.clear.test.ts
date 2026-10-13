import { runSessionCleanup } from '../../../core/security/sessionCleanup';
import { removeJson } from '../../../core/storage/secureJsonStore';
import { DELETED_KEY } from './removedReminders';

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJson: jest.fn(), readJsonStrict: jest.fn(), writeJson: jest.fn(), removeJson: jest.fn().mockResolvedValue(undefined) }));

it('çıkışta silinen-hatırlatma listesi ve kullanıcının bildirim durumu temizlenir', async () => {
  await runSessionCleanup('u1', 'sign-out');
  expect(removeJson).toHaveBeenCalledWith(DELETED_KEY);
  expect(removeJson).toHaveBeenCalledWith('notifications.read.u1');
  expect(removeJson).toHaveBeenCalledWith('notifications.dismissed.u1');
});
