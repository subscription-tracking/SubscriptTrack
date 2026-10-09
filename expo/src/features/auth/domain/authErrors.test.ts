import { GENERIC_AUTH_ERROR, localizeAuthError, messageForError } from './authErrors';

describe('localizeAuthError', () => {
  it.each([
    ['Invalid login credentials', 'E-posta veya şifre hatalı.'],
    ['User already registered', 'Bu e-posta zaten kayıtlı.'],
    ['Password should be at least 10 characters.', 'Şifre en az 10 karakter olmalı.'],
    ['email rate limit exceeded', 'Çok fazla deneme. Lütfen biraz bekle.'],
    ['fetch network failure', 'Bağlantı hatası. İnternet bağlantını kontrol et.'],
  ])('%s → Türkçe mesaj', (input, expected) => {
    expect(localizeAuthError(input)).toBe(expected);
  });

  it('eşleşmeyen sunucu metnini olduğu gibi bırakır', () => {
    expect(localizeAuthError('Something else')).toBe('Something else');
  });

  it('boş metin genel mesaja düşer', () => {
    expect(localizeAuthError(undefined)).toBe(GENERIC_AUTH_ERROR);
    expect(localizeAuthError('   ')).toBe(GENERIC_AUTH_ERROR);
  });
});

describe('messageForError', () => {
  it('Error nesnesinin mesajını yerelleştirir', () => {
    expect(messageForError(new Error('Invalid login credentials'))).toBe(
      'E-posta veya şifre hatalı.',
    );
  });

  it('Error olmayan değerlerde genel mesaj döner', () => {
    expect(messageForError('boom')).toBe(GENERIC_AUTH_ERROR);
  });
});
