import { buildSubscriptionCsv } from '../../settings/domain/csvExport';
import { civilDate } from '../../../core/time/calendar';
import { subscriptionFromRow, type SubscriptionRow } from './subscription';
import { MAX_IMPORT_ROWS, normalizeHeader, parseSubscriptionCsv, restoreFormula, splitCsvLine } from './csvImportParser';

const HEADER = 'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after';

describe('parseSubscriptionCsv', () => {
  it('boş dosyayı ve eksik başlığı hata olarak bildirir', () => {
    expect(parseSubscriptionCsv('').errors).toEqual(['CSV dosyası boş.']);
    expect(parseSubscriptionCsv('name,amount').errors[0]).toContain('Eksik başlık');
  });

  it('geçerli satırı alan modeline çevirir', () => {
    const { rows, errors } = parseSubscriptionCsv(`${HEADER}\nNetflix,149.99,try,monthly,2026-10-15,streaming,active,not,Kart,,`);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount.decimalString).toBe('149.99');
    expect(rows[0].currency).toBe('TRY');
    expect(rows[0].nextRenewalDate).toEqual(civilDate(2026, 10, 15));
    expect(rows[0].notes).toBe('not');
  });

  it('Türkçe döngü değerini kabul eder; bilinmeyen kategori other olur', () => {
    const { rows, errors } = parseSubscriptionCsv('name,amount,currency,billing_cycle,next_renewal_date,category\nSpotify,59.90,TRY,yıllık,2026-11-01,müzik');
    expect(errors).toEqual([]);
    expect(rows[0].billingCycle).toBe('yearly');
    expect(rows[0].category).toBe('other');
  });

  it('bozuk tarih, sıfır tutar ve boş ad satır hatası üretir', () => {
    const csv = `${HEADER}\n,10,TRY,monthly,2026-10-01,other\nA,0,TRY,monthly,2026-10-01,other\nB,10,TRY,monthly,2026-02-30,other`;
    const { rows, errors } = parseSubscriptionCsv(csv);
    expect(rows).toEqual([]);
    expect(errors).toEqual([
      'Satır 2: ad, tutar veya tarih geçersiz.',
      'Satır 3: ad, tutar veya tarih geçersiz.',
      'Satır 4: ad, tutar veya tarih geçersiz.',
    ]);
  });

  it('aynı adı (büyük/küçük harf farklı olsa da) tekrar eden satırı atlar', () => {
    const csv = `${HEADER}\nNetflix,1,TRY,monthly,2026-10-01,other\nnetflix,2,TRY,monthly,2026-10-01,other`;
    expect(parseSubscriptionCsv(csv).errors).toEqual(['Satır 3: aynı abonelik tekrar ediyor.']);
  });

  it('üç harfli olmayan para birimini reddeder', () => {
    const csv = `${HEADER}\nA,10,TRYX,monthly,2026-10-01,other`;
    expect(parseSubscriptionCsv(csv).errors).toEqual(['Satır 2: para birimi geçersiz.']);
  });

  it('trial bitiş tarihi girilmişse geçerli olmalı', () => {
    const csv = `${HEADER}\nA,10,TRY,monthly,2026-10-01,other,trial,,,2026-02-31,`;
    expect(parseSubscriptionCsv(csv).errors).toHaveLength(1);
  });

  it('satır sayısı sınırı aşılınca fazlasını atlar ve uyarır', () => {
    const lines = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, index) => `Abone ${index},10,TRY,monthly,2026-10-01,other`);
    const { rows, errors } = parseSubscriptionCsv([HEADER, ...lines].join('\n'));
    expect(rows).toHaveLength(MAX_IMPORT_ROWS);
    expect(errors[0]).toContain(`En fazla ${MAX_IMPORT_ROWS}`);
  });

  it('dışa aktarılan dosyayı formül önekiyle birlikte değişmeden geri içe aktarır', () => {
    const subscription = subscriptionFromRow({
      id: 'x',
      name: '=SUM(1)',
      amount: '99.00',
      currency: 'TRY',
      billing_cycle: 'monthly',
      category: 'other',
      status: 'active',
      start_date: null,
      next_renewal_date: '2026-10-15',
      payment_method: '+kart',
      notes: '@not',
      website: null,
      trial_end_date: null,
      trial_price_after: null,
    } as SubscriptionRow);
    const { rows, errors } = parseSubscriptionCsv(buildSubscriptionCsv([subscription]));
    expect(errors).toEqual([]);
    expect(rows[0].name).toBe('=SUM(1)');
    expect(rows[0].paymentMethod).toBe('+kart');
    expect(rows[0].notes).toBe('@not');
  });
});

describe('yardımcılar', () => {
  it('başlık normalizasyonu Türkçe karakterleri çevirir', () => {
    expect(normalizeHeader(' Sonraki Yenileme ')).toBe('sonraki_yenileme');
    expect(normalizeHeader('Ödeme Yöntemi')).toBe('odeme_yontemi');
  });

  it('formül önekini yalnızca tetikleyici karakterlerde geri alır', () => {
    expect(restoreFormula("'=A1")).toBe('=A1');
    expect(restoreFormula("'abc")).toBe("'abc");
  });

  it('tırnaklı alanları ayırır', () => {
    expect(splitCsvLine('"a,b","c ""d"""')).toEqual(['a,b', 'c "d"']);
  });
});
