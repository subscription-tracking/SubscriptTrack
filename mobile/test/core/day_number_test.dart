import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';

void main() {
  group('DateTimeUtils.dayNumber', () {
    test('1970-01-01 gün 0; ardışık günler 1 artar', () {
      expect(DateTimeUtils.dayNumber(DateTime(1970, 1, 1)), 0);
      expect(DateTimeUtils.dayNumber(DateTime(1970, 1, 2)), 1);
      expect(DateTimeUtils.dayNumber(DateTime(1969, 12, 31)), -1);
    });

    test('saat bileşeni günü değiştirmez', () {
      final a = DateTime(2026, 9, 30, 0, 0, 1);
      final b = DateTime(2026, 9, 30, 23, 59, 59);
      expect(DateTimeUtils.dayNumber(a), DateTimeUtils.dayNumber(b));
    });

    test('ay/yıl sınırlarında ve artık yılda tam gün farkı verir', () {
      int diff(DateTime from, DateTime to) =>
          DateTimeUtils.dayNumber(to) - DateTimeUtils.dayNumber(from);
      expect(diff(DateTime(2026, 1, 31), DateTime(2026, 2, 1)), 1);
      expect(diff(DateTime(2024, 2, 28), DateTime(2024, 3, 1)), 2);
      expect(diff(DateTime(2026, 12, 31), DateTime(2027, 1, 1)), 1);
      expect(diff(DateTime(2026, 1, 1), DateTime(2027, 1, 1)), 365);
    });

    test('yaz saati geçişi olan aylar da tam gün sayılır', () {
      // Yerel gece yarıları arasındaki fark yaz/kış saatinde 23 veya 25 saat
      // olabilir; gün numarası farkı yine de takvim günü sayısıdır.
      for (final month in [3, 10, 11]) {
        for (var day = 1; day < 28; day++) {
          final a = DateTime(2026, month, day);
          final b = DateTime(2026, month, day + 1);
          expect(DateTimeUtils.dayNumber(b) - DateTimeUtils.dayNumber(a), 1);
        }
      }
    });
  });
}
