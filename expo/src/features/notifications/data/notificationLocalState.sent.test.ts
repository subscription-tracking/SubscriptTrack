import { markSentMarkers, readSentMarkers, SENT_MARKER_TTL_MS } from './notificationLocalState';
import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJson: jest.fn(async () => null), writeJson: jest.fn(async () => undefined) }));

const now = new Date('2026-10-09T10:00:00.000Z');

beforeEach(() => {
  jest.mocked(readJson).mockReset().mockResolvedValue(null);
  jest.mocked(writeJson).mockReset().mockResolvedValue(undefined);
});

it('yedek işaretlerini kullanıcıya özel anahtara yazar ve 7 günden eskileri budar', async () => {
  const old = now.getTime() - SENT_MARKER_TTL_MS - 1;
  jest.mocked(readJson).mockResolvedValue({ 'st:c|eski|2026-09-01': old, 'st:o|taze|2026-10-08': now.getTime() - 1000 });
  await markSentMarkers('user-1', ['st:c|yeni|2026-10-09'], now);
  expect(writeJson).toHaveBeenCalledWith('notifications.catchup.sent.user-1', {
    'st:o|taze|2026-10-08': now.getTime() - 1000,
    'st:c|yeni|2026-10-09': now.getTime(),
  });
});

it('okurken eski işaretleri yok sayar ve bozuk veriyi boş kabul eder', async () => {
  jest.mocked(readJson).mockResolvedValue({ 'st:c|eski|x': now.getTime() - SENT_MARKER_TTL_MS - 1, 'st:c|taze|y': now.getTime() });
  expect([...(await readSentMarkers('user-1', now))]).toEqual(['st:c|taze|y']);
  jest.mocked(readJson).mockResolvedValue(['bozuk']);
  expect((await readSentMarkers('user-1', now)).size).toBe(0);
});
