import { parseSubscriptionCsv } from '../domain/csvImportParser';
import { importSubscriptionRows } from './csvImport';
import { changeSubscriptionStatus } from './subscriptionMutations';
import { createSubscription } from './subscriptionWriteRepository';
import { type CivilDate } from '../../../core/time/calendar';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }));
jest.mock('./subscriptionMutations', () => ({ changeSubscriptionStatus: jest.fn() }));
jest.mock('./subscriptionWriteRepository', () => ({ createSubscription: jest.fn() }));

const HEADER = 'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after';
const TODAY: CivilDate = { year: 2026, month: 10, day: 11 };

describe('importSubscriptionRows', () => {
  beforeEach(() => {
    jest.mocked(createSubscription).mockReset().mockResolvedValue('created-id');
    jest.mocked(changeSubscriptionStatus).mockReset().mockResolvedValue({ status: 'sent', eventSaved: true });
  });

  it('kaydeder ve mevcut kuralın izin vermediği CSV durumunu uyarıda bildirir', async () => {
    const rows = parseSubscriptionCsv(`${HEADER}\nLegacy,49.90,TRY,monthly,2026-10-20,streaming,expired,,,,`).rows;

    const result = await importSubscriptionRows('user-id', rows, TODAY, () => undefined);

    expect(result.created).toBe(1);
    expect(result.warnings).toEqual(['Satır 2: "Legacy" eklendi; durum (expired) içe aktarılamadı.']);
    expect(changeSubscriptionStatus).not.toHaveBeenCalled();
  });

  it('izin verilen CSV durumunu oluşturma sonrasında uygular', async () => {
    const rows = parseSubscriptionCsv(`${HEADER}\nPaused,49.90,TRY,monthly,2026-10-20,streaming,paused,,,,`).rows;

    const result = await importSubscriptionRows('user-id', rows, TODAY, () => undefined);

    expect(result.created).toBe(1);
    expect(result.warnings).toEqual([]);
    expect(changeSubscriptionStatus).toHaveBeenCalledWith({
      userId: 'user-id',
      subscriptionId: 'created-id',
      to: 'paused',
      idempotencyKey: 'test-uuid',
    });
  });
});
