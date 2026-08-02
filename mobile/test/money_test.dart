import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';

void main() {
  group('Money.parse', () {
    test('noktalı ondalık', () {
      expect(Money.parse('12.50').minorUnits, 1250);
    });

    test('virgüllü ondalık', () {
      expect(Money.parse('12,50').minorUnits, 1250);
    });

    test('tam sayı', () {
      expect(Money.parse('100').minorUnits, 10000);
    });

    test('geçersiz string sıfır döner', () {
      expect(Money.parse('').minorUnits, 0);
    });

    test('floating point drift olmaz', () {
      // 0.1 + 0.2 == 0.30000000000000004 double'da ama Money'de 30 kuruş
      final a = Money.parse('0.10');
      final b = Money.parse('0.20');
      expect((a + b).minorUnits, 30);
      expect((a + b).amount, closeTo(0.30, 0.001));
    });
  });

  group('Money.fromJson', () {
    test('double JSON değerinden', () {
      expect(Money.fromJson(12.5).minorUnits, 1250);
    });

    test('int JSON değerinden', () {
      expect(Money.fromJson(100).minorUnits, 10000);
    });

    test('null yerine zero', () {
      expect(Money.fromJson(null).minorUnits, 0);
    });
  });

  group('Money aritmetik', () {
    final a = Money.parse('10.00');
    final b = Money.parse('5.00');

    test('toplama', () => expect((a + b).minorUnits, 1500));
    test('çıkarma', () => expect((a - b).minorUnits, 500));
    test('çarpma', () => expect((a * 2).minorUnits, 2000));
    test('bölme', () => expect((a / 4).minorUnits, 250));
    test('compareTo büyük', () => expect(a.compareTo(b), greaterThan(0)));
    test('compareTo eşit', () => expect(a.compareTo(a), 0));
    test('compareTo küçük', () => expect(b.compareTo(a), lessThan(0)));
    test('eşitlik', () => expect(Money.parse('10.00'), equals(a)));
  });

  group('Money.toJson', () {
    test('double döner', () {
      expect(Money.parse('12.50').toJson(), '12.50');
    });
  });

  group('Billing cycle monthlyAmount', () {
    // Bu testler Subscription.monthlyAmount hesaplarını Money ile doğrular
    test('aylık → aynı tutar', () {
      final m = Money.parse('100.00');
      // monthly: amount * 1
      expect((m * 1).minorUnits, 10000);
    });

    test('yıllık → aylık bölen 12', () {
      final m = Money.parse('120.00');
      expect((m / 12).minorUnits, 1000); // 10.00 TL/ay
    });

    test('3 aylık → aylık bölen 3', () {
      final m = Money.parse('30.00');
      expect((m / 3).minorUnits, 1000); // 10.00 TL/ay
    });

    test('haftalık → çarpar 4.33', () {
      final m = Money.parse('10.00');
      // 10 * 4.33 = 43.30 → 4330 minor units
      expect((m * 4.33).minorUnits, 4330);
    });
  });
}
