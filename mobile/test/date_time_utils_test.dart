import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/utils/date_time_utils.dart';

void main() {
  group('DateTimeUtils.renewalLabel (S4)', () {
    test('negatif gün → süresi doldu', () {
      expect(DateTimeUtils.renewalLabel(-1), 'Süresi doldu');
    });

    test('0 gün → bugün yenileniyor', () {
      expect(DateTimeUtils.renewalLabel(0), 'Bugün yenileniyor');
    });

    test('1 gün → yarın yenileniyor', () {
      expect(DateTimeUtils.renewalLabel(1), 'Yarın yenileniyor');
    });

    test('3 gün → 3 gün sonra', () {
      expect(DateTimeUtils.renewalLabel(3), '3 gün sonra');
    });

    test('7 gün → 7 gün sonra (sınır: ≤7 ise gün)', () {
      expect(DateTimeUtils.renewalLabel(7), '7 gün sonra');
    });

    test('14 gün → 2 hafta sonra', () {
      expect(DateTimeUtils.renewalLabel(14), '2 hafta sonra');
    });

    test('21 gün → 3 hafta sonra', () {
      expect(DateTimeUtils.renewalLabel(21), '3 hafta sonra');
    });

    test('30 gün → 4 hafta sonra (sınır: ≤30 ise hafta)', () {
      expect(DateTimeUtils.renewalLabel(30), '4 hafta sonra');
    });

    test('60 gün → 2 ay sonra', () {
      expect(DateTimeUtils.renewalLabel(60), '2 ay sonra');
    });

    test('365 gün → 12 ay sonra', () {
      expect(DateTimeUtils.renewalLabel(365), '12 ay sonra');
    });
  });

  group('DateTimeUtils.formatCurrency (S4)', () {
    test('varsayılan sembol ₺', () {
      expect(DateTimeUtils.formatCurrency(10.0), '₺10,00');
    });

    test('özel sembol USD — ISO kodu sembole çevrilir', () {
      expect(DateTimeUtils.formatCurrency(9.99, symbol: 'USD'), '\$9,99');
    });

    test('tam sayı tutarlar virgüllü yazar', () {
      expect(DateTimeUtils.formatCurrency(100.0), '₺100,00');
    });

    test('sıfır tutar', () {
      expect(DateTimeUtils.formatCurrency(0.0), '₺0,00');
    });

    test('büyük tutar', () {
      expect(DateTimeUtils.formatCurrency(1234.56), '₺1234,56');
    });

    test('ondalık nokta yerine virgül kullanır', () {
      final result = DateTimeUtils.formatCurrency(12.50);
      expect(result, contains(','));
      expect(result, isNot(contains('.')));
    });
  });

  group('DateTimeUtils.formatDate (S5)', () {
    test('bugün → Bugün', () {
      final today = DateTime.now();
      expect(DateTimeUtils.formatDate(today), 'Bugün');
    });

    test('yarın → Yarın', () {
      // Duration(days:1) bazen inDays=0 verir; sabit gün+1 kullan.
      final now = DateTime.now();
      final tomorrow = DateTime(now.year, now.month, now.day + 1, 12);
      expect(DateTimeUtils.formatDate(tomorrow), 'Yarın');
    });

    test('geçmiş tarih → Geçti', () {
      final past = DateTime.now().subtract(const Duration(days: 5));
      expect(DateTimeUtils.formatDate(past), 'Geçti');
    });

    test('gelecek tarih → gün ay yıl formatı', () {
      final future = DateTime(2027, 3, 15);
      final result = DateTimeUtils.formatDate(future);
      expect(result, contains('15'));
      expect(result, contains('2027'));
      expect(result, contains('Mar'));
    });

    test('tüm ay isimleri tanımlı (12 ay)', () {
      // Her ay için gelecekte bir tarih oluştur ve format çökmez kontrol et
      for (var m = 1; m <= 12; m++) {
        final date = DateTime(2030, m, 1);
        expect(() => DateTimeUtils.formatDate(date), returnsNormally);
      }
    });
  });
}
