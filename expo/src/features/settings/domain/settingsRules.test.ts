import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { CSV_HEADERS, buildSubscriptionCsv, csvField, neutralizeFormula } from './csvExport';
import { CONFIRM_WORD, hasDeleteErrors, validateDeleteAccount } from './deleteAccountRules';
import { METHOD_MAX_COUNT, addPaymentMethod, removePaymentMethod } from './paymentMethodRules';
import { FEEDBACK_CATEGORIES, feedbackShareText, validateFeedbackMessage } from './feedbackRules';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'id',
  name: 'Netflix',
  amount: '149.99',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

describe('CSV formül koruması', () => {
  it('tetikleyici karakterle başlayan metne başına tek tırnak ekler', () => {
    expect(neutralizeFormula('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(neutralizeFormula('+1')).toBe(`'+1`);
    expect(neutralizeFormula('@cmd')).toBe(`'@cmd`);
    expect(neutralizeFormula('Netflix')).toBe('Netflix');
  });

  it('metin alanındaki tırnakları çiftler', () => {
    expect(csvField('say "merhaba"')).toBe('"say ""merhaba"""');
  });

  it('sayısal alanda koruma uygulanmaz', () => {
    expect(csvField('-5', false)).toBe('"-5"');
  });
});

describe('buildSubscriptionCsv', () => {
  it('11 alanlı başlık ve CRLF satır sonu üretir', () => {
    const csv = buildSubscriptionCsv([]);
    expect(csv.split('\r\n')[0]).toBe(CSV_HEADERS.map((header) => `"${header}"`).join(','));
  });

  it('kötü niyetli ad ve notu etkisizleştirir; tarih ve tutarı olduğu gibi yazar', () => {
    const subscription = subscriptionFromRow(
      row({ name: '=cmd|" /C calc"!A0', notes: '+SUM(1)', trial_end_date: '2026-11-01', trial_price_after: '99.00' }),
    );
    const line = buildSubscriptionCsv([subscription]).split('\r\n')[1];
    expect(line).toContain(`"'=cmd|"" /C calc""!A0"`);
    expect(line).toContain(`"'+SUM(1)"`);
    expect(line).toContain('"2026-10-15"');
    expect(line).toContain('"2026-11-01"');
    expect(line).toContain('"99.00"');
  });

  it('tarih yoksa boş alan yazar', () => {
    const line = buildSubscriptionCsv([subscriptionFromRow(row({ next_renewal_date: null }))]).split('\r\n')[1];
    expect(line.split(',')[4]).toBe('""');
  });
});

describe('hesap silme onayı', () => {
  const valid = { password: 'x', confirmation: CONFIRM_WORD, acknowledged: true };

  it('üç koşul birden sağlanınca hata yoktur', () => {
    expect(hasDeleteErrors(validateDeleteAccount(valid))).toBe(false);
  });

  it('büyük harfli ve boşluklu "sil" kabul edilir', () => {
    expect(hasDeleteErrors(validateDeleteAccount({ ...valid, confirmation: '  SİL ' }))).toBe(false);
  });

  it('şifre, onay yazısı ve onay kutusu eksikse reddeder', () => {
    expect(validateDeleteAccount({ ...valid, password: '' }).password).toBeDefined();
    expect(validateDeleteAccount({ ...valid, confirmation: 'evet' }).confirmation).toBeDefined();
    expect(validateDeleteAccount({ ...valid, acknowledged: false }).acknowledged).toBeDefined();
  });
});

describe('ödeme yöntemleri', () => {
  it('ad ekler ve kırpar', () => {
    expect(addPaymentMethod([], '  Garanti Bonus ')).toEqual({ ok: true, methods: ['Garanti Bonus'] });
  });

  it('büyük/küçük harf duyarsız tekrarı reddeder', () => {
    expect(addPaymentMethod(['Garanti Bonus'], 'garanti bonus')).toEqual({ ok: false, error: 'Bu yöntem zaten listede' });
  });

  it('boş ve 80 karakteri aşan adı reddeder', () => {
    expect(addPaymentMethod([], '   ').ok).toBe(false);
    expect(addPaymentMethod([], 'a'.repeat(81)).ok).toBe(false);
  });

  it('en fazla 40 yöntem', () => {
    const full = Array.from({ length: METHOD_MAX_COUNT }, (_, index) => `Y${index}`);
    expect(addPaymentMethod(full, 'Yeni').ok).toBe(false);
  });

  it('kaldırma yalnızca eşleşen adı çıkarır', () => {
    expect(removePaymentMethod(['A', 'B'], 'A')).toEqual(['B']);
  });
});

describe('geri bildirim', () => {
  it('boş ve 2000 karakteri aşan mesajı reddeder', () => {
    expect(validateFeedbackMessage('   ')).not.toBeNull();
    expect(validateFeedbackMessage('a'.repeat(2001))).not.toBeNull();
    expect(validateFeedbackMessage('Harika')).toBeNull();
  });

  it('kategoriler Flutter ile aynıdır ve paylaşım metni doğru biçimde oluşur', () => {
    expect(FEEDBACK_CATEGORIES).toEqual(['Özellik isteği', 'Hata bildirimi', 'Genel öneri']);
    expect(feedbackShareText('Hata bildirimi', ' bozuk ')).toBe('SubscriptTrack Hata bildirimi\n\nbozuk');
  });
});

describe('tarih yardımcısı', () => {
  it('civilDate ile CSV tarihi tutarlı', () => {
    expect(buildSubscriptionCsv([subscriptionFromRow(row({ next_renewal_date: '2026-01-05' }))])).toContain('"2026-01-05"');
    expect(civilDate(2026, 1, 5).day).toBe(5);
  });
});
