import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/currency.dart';

void main() {
  group('AppCurrency.normalize', () {
    test('sembol, ISO kodu ve TL takma adı standart koda çevrilir', () {
      expect(AppCurrency.normalize('₺'), 'TRY');
      expect(AppCurrency.normalize('tl'), 'TRY');
      expect(AppCurrency.normalize(' try '), 'TRY');
      expect(AppCurrency.normalize(r'$'), 'USD');
      expect(AppCurrency.normalize('usd'), 'USD');
      expect(AppCurrency.normalize('€'), 'EUR');
      expect(AppCurrency.normalize('£'), 'GBP');
    });

    test('boş girdi TRY, bilinmeyen kod büyük harfle korunur', () {
      expect(AppCurrency.normalize(''), 'TRY');
      expect(AppCurrency.normalize('   '), 'TRY');
      expect(AppCurrency.normalize('jpy'), 'JPY');
    });
  });

  group('AppCurrency.symbolOf / nameOf', () {
    test('kod veya sembolden sembol', () {
      expect(AppCurrency.symbolOf('USD'), r'$');
      expect(AppCurrency.symbolOf('€'), '€');
      expect(AppCurrency.symbolOf('GBP'), '£');
      expect(AppCurrency.symbolOf('TRY'), '₺');
    });

    test('null, boş ve bilinmeyen değerler ₺ varsayılanına düşer', () {
      expect(AppCurrency.symbolOf(null), '₺');
      expect(AppCurrency.symbolOf(''), '₺');
      expect(AppCurrency.symbolOf('JPY'), '₺');
    });

    test('Türkçe adlar', () {
      expect(AppCurrency.nameOf('USD'), 'Amerikan Doları');
      expect(AppCurrency.nameOf('EUR'), 'Euro');
      expect(AppCurrency.nameOf('GBP'), 'İngiliz Sterlini');
      expect(AppCurrency.nameOf('TRY'), 'Türk Lirası');
      expect(AppCurrency.nameOf(null), 'Türk Lirası');
      expect(AppCurrency.nameOf('XXX'), 'Türk Lirası');
    });
  });

  group('seçenek listeleri', () {
    test('desteklenen para birimleri sabit sırada', () {
      expect(AppCurrency.supported.map((c) => c.code),
          ['TRY', 'USD', 'EUR', 'GBP']);
    });

    test('form seçenekleri (kod, sembol)', () {
      expect(AppCurrency.options, [
        ('TRY', '₺'),
        ('USD', r'$'),
        ('EUR', '€'),
        ('GBP', '£'),
      ]);
    });

    test('onboarding seçenekleri (sembol, ad, kod)', () {
      expect(AppCurrency.onboardingOptions.first, ('₺', 'Türk Lirası', 'TRY'));
      expect(AppCurrency.onboardingOptions, hasLength(4));
    });
  });
}
