import { shareCsvFile } from './exportFile';

const mockFile = { uri: 'file:///cache/s.csv', exists: false, delete: jest.fn(), create: jest.fn(), write: jest.fn() };
const mockShare = jest.fn();
jest.mock('expo-file-system', () => ({
  File: jest.fn(() => mockFile),
  Paths: { cache: 'cache' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));

beforeEach(() => {
  mockFile.exists = false;
  mockFile.delete.mockReset();
  mockFile.create.mockImplementation(() => { mockFile.exists = true; });
  mockShare.mockReset().mockResolvedValue(undefined);
});

it("paylaşımdan sonra cache'teki CSV dosyası silinir", async () => {
  await shareCsvFile('a,b', 'Europe/Istanbul');
  expect(mockFile.write).toHaveBeenCalledWith('a,b');
  expect(mockFile.delete).toHaveBeenCalledTimes(1);
});

it('paylaşım iptal/hata olsa da dosya silinir ve hata iletilir', async () => {
  mockShare.mockRejectedValue(new Error('iptal'));
  await expect(shareCsvFile('a,b', 'Europe/Istanbul')).rejects.toThrow('iptal');
  expect(mockFile.delete).toHaveBeenCalledTimes(1);
});
