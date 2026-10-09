import {
  PASSWORD_MIN_LENGTH,
  isValidNewPassword,
  normalizeEmail,
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validatePasswordConfirmation,
} from './authRules';

describe('parola kuralı (yeni parola)', () => {
  it('minimum uzunluk Flutter ile aynı: 10', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10);
  });

  it('9 karakter reddedilir, 10 karakter kabul edilir', () => {
    expect(isValidNewPassword('123456789')).toBe(false);
    expect(isValidNewPassword('1234567890')).toBe(true);
  });

  it('boş ve kısa parola için doğru mesajları döner', () => {
    expect(validateNewPassword('')).toBe('Şifre gerekli.');
    expect(validateNewPassword('abc')).toBe('Şifre en az 10 karakter olmalı.');
    expect(validateNewPassword('abcdefghij')).toBeNull();
  });
});

describe('giriş parolası', () => {
  it('giriş ekranında uzunluk dayatılmaz (eski kısa parolalı kullanıcılar girebilir)', () => {
    expect(validateLoginPassword('abc')).toBeNull();
    expect(validateLoginPassword('')).toBe('Şifre gerekli.');
  });
});

describe('parola tekrarı', () => {
  it('eşleşmezse hata döner', () => {
    expect(validatePasswordConfirmation('abcdefghij', 'abcdefghik')).toBe('Şifreler eşleşmiyor.');
    expect(validatePasswordConfirmation('abcdefghij', 'abcdefghij')).toBeNull();
  });
});

describe('e-posta doğrulaması ve normalizasyon', () => {
  it('boş ve "@" içermeyen girdiyi reddeder', () => {
    expect(validateEmail('  ')).toBe('E-posta gerekli.');
    expect(validateEmail('ornek.com')).toBe('Geçerli bir e-posta gir.');
    expect(validateEmail('ornek@mail.com')).toBeNull();
  });

  it('e-posta kırpılır ve küçük harfe çevrilir', () => {
    expect(normalizeEmail('  Furkan@Ornek.COM ')).toBe('furkan@ornek.com');
  });
});
