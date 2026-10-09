jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { HEX: 'hex' },
    digestStringAsync: async (_algorithm: string, data: string) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex'),
    getRandomBytes: (count: number) => new Uint8Array(nodeCrypto.randomBytes(count)),
  };
});

import { constantTimeEquals, createPinRecord, verifyPinRecord } from './pinRecord';

describe('PIN kaydı', () => {
  it('doğru PIN doğrulanır, yanlış PIN reddedilir', async () => {
    const record = await createPinRecord('1234', 3);
    expect(await verifyPinRecord('1234', record)).toBe(true);
    expect(await verifyPinRecord('1235', record)).toBe(false);
  });

  it('ham PIN kayıtta yer almaz ve her kayıt farklı tuz kullanır', async () => {
    const first = await createPinRecord('4321', 3);
    const second = await createPinRecord('4321', 3);
    expect(first.includes('4321')).toBe(false);
    expect(first).not.toBe(second);
  });

  it('bozuk veya bilinmeyen sürümdeki kayıt reddedilir', async () => {
    expect(await verifyPinRecord('1234', 'garbage')).toBe(false);
    expect(await verifyPinRecord('1234', 'v9:3:aa:bb')).toBe(false);
  });

  it('aşırı tur sayısı reddedilir', async () => {
    expect(await verifyPinRecord('1234', 'v1:999999:aa:bb')).toBe(false);
  });
});

describe('constantTimeEquals', () => {
  it('eşit ve farklı dizgileri ayırt eder', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
  });
});
