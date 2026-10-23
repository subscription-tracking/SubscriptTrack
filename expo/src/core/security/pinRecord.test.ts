import { constantTimeEquals, createPinRecord, derivePin, pinRecordNeedsUpgrade, verifyPinRecord } from './pinRecord';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pinGoldens = (JSON.parse(
  readFileSync(resolve(process.cwd(), '../testdata/flutter_expo_domain_goldens.json'), 'utf8'),
) as {
  pinCompatibility: { pin: string; legacySha256: string; pbkdf2V2: string };
}).pinCompatibility;

jest.mock('expo-crypto', () => {
  // Jest mock factory must load Node crypto inside its own scope.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { HEX: 'hex' },
    digestStringAsync: async (_algorithm: string, data: string) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex'),
    getRandomBytes: (count: number) => new Uint8Array(nodeCrypto.randomBytes(count)),
  };
});

describe('PIN kaydı', () => {
  it('doğru PIN doğrulanır, yanlış PIN reddedilir', async () => {
    const record = await createPinRecord('1234', 3);
    expect(record.startsWith('v2:3:')).toBe(true);
    expect(await verifyPinRecord('1234', record)).toBe(true);
    expect(await verifyPinRecord('1235', record)).toBe(false);
  });

  it('ham PIN kayıtta yer almaz ve her kayıt farklı tuz kullanır', async () => {
    const first = await createPinRecord('4321', 3);
    const second = await createPinRecord('4321', 3);
    expect(first.includes('4321')).toBe(false);
    expect(first).not.toBe(second);
    expect(first.split(':')[2]).toMatch(/==$/);
    expect(first.split(':')[3]).toMatch(/=$/);
  });

  it('bozuk veya bilinmeyen sürümdeki kayıt reddedilir', async () => {
    expect(await verifyPinRecord('1234', 'garbage')).toBe(false);
    expect(await verifyPinRecord('1234', 'v9:3:aa:bb')).toBe(false);
  });

  it('aşırı tur sayısı reddedilir', async () => {
    expect(await verifyPinRecord('1234', 'v1:999999:aa:bb')).toBe(false);
  });

  it('Flutter PBKDF2 biçimini bağımsız test vektörüyle doğrular', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const salt = Buffer.from('0123456789abcdef');
    const digest = nodeCrypto.pbkdf2Sync('1234', salt, 500, 32, 'sha256');
    const record = `v2:500:${salt.toString('base64url')}:${digest.toString('base64url')}`;
    expect(await verifyPinRecord('1234', record)).toBe(true);
    expect(await verifyPinRecord('1235', record)).toBe(false);
    expect(pinRecordNeedsUpgrade(record)).toBe(true);
  });

  it('önceki Expo v1 özetini doğrular ve yükseltmeye işaretler', async () => {
    const salt = '0123456789abcdef0123456789abcdef';
    const digest = await derivePin('2468', salt, 3);
    const record = `v1:3:${salt}:${digest}`;
    expect(await verifyPinRecord('2468', record)).toBe(true);
    expect(pinRecordNeedsUpgrade(record)).toBe(true);
  });

  it('Flutter eski tek tur SHA-256 özetini doğrular', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const record = nodeCrypto.createHash('sha256').update('1234').digest('hex');
    expect(await verifyPinRecord('1234', record)).toBe(true);
    expect(pinRecordNeedsUpgrade(record)).toBe(true);
  });

  it('paylaşılan Flutter–Expo legacy SHA-256 ve PBKDF2 v2 vektörlerini doğrular', async () => {
    expect(await verifyPinRecord(pinGoldens.pin, pinGoldens.legacySha256)).toBe(true);
    expect(await verifyPinRecord('9999', pinGoldens.legacySha256)).toBe(false);
    expect(await verifyPinRecord(pinGoldens.pin, pinGoldens.pbkdf2V2)).toBe(true);
    expect(await verifyPinRecord('9999', pinGoldens.pbkdf2V2)).toBe(false);
  });
});

describe('constantTimeEquals', () => {
  it('eşit ve farklı dizgileri ayırt eder', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
  });
});
