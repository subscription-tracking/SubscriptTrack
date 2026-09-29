import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/utils/csv_safety.dart';

void main() {
  group('CsvSafety.neutralizeFormula', () {
    test('formül tetikleyicileri ile başlayan metnin başına \' eklenir', () {
      for (final trigger in ['=', '+', '-', '@', '\t', '\r']) {
        expect(CsvSafety.neutralizeFormula('${trigger}cmd'), "'${trigger}cmd",
            reason: 'tetikleyici: ${trigger.codeUnitAt(0)}');
      }
    });

    test('normal metin ve boş metin değişmez', () {
      expect(CsvSafety.neutralizeFormula('Netflix'), 'Netflix');
      expect(CsvSafety.neutralizeFormula(''), '');
      expect(CsvSafety.neutralizeFormula('a=b'), 'a=b');
    });
  });

  group('CsvSafety.restoreFormula', () {
    test('yalnızca \' + tetikleyici desenini çözer', () {
      expect(CsvSafety.restoreFormula("'=1+1"), '=1+1');
      expect(CsvSafety.restoreFormula("'-5"), '-5');
      expect(CsvSafety.restoreFormula("'Merhaba"), "'Merhaba");
      expect(CsvSafety.restoreFormula("'"), "'");
      expect(CsvSafety.restoreFormula(''), '');
    });

    test('neutralize → restore gidiş-dönüşü veriyi korur', () {
      for (final v in ['=SUM(A1)', '+90 555', '-x', '@user', 'düz', '']) {
        expect(CsvSafety.restoreFormula(CsvSafety.neutralizeFormula(v)), v);
      }
    });
  });

  group('CsvSafety.field', () {
    test('tırnakları kaçırır ve formülü etkisizleştirir', () {
      expect(CsvSafety.field('=HYPERLINK("http://x","tıkla")'),
          '"\'=HYPERLINK(""http://x"",""tıkla"")"');
      expect(CsvSafety.field('Ad, "soyad"'), '"Ad, ""soyad"""');
    });

    test('text: false sayısal sütunları korur', () {
      expect(CsvSafety.field('-5.00', text: false), '"-5.00"');
      expect(CsvSafety.field('-5.00'), '"\'-5.00"');
    });
  });
}
