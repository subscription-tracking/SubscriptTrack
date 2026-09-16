import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/subscriptions/data/csv_import_parser.dart';

void main() {
  test('CSV geçerli satırları parse eder', () {
    final result = CsvImportParser.parse(
      'name,amount,currency,billing_cycle,next_renewal_date,category\n'
      'Netflix,"199,99",TRY,monthly,2026-10-01,streaming',
    );
    expect(result.errors, isEmpty);
    expect(result.rows.single.name, 'Netflix');
    expect(result.rows.single.amount.decimalString, '199.99');
  });

  test('tırnaklı virgül ve duplicate satırları yönetir', () {
    final result = CsvImportParser.parse(
      'name,amount,currency,billing_cycle,next_renewal_date,category\n'
      '"Family, Plan",10,TRY,monthly,2026-10-01,other\n'
      '"Family, Plan",10,TRY,monthly,2026-10-01,other',
    );
    expect(result.rows, hasLength(1));
    expect(result.rows.single.name, 'Family, Plan');
    expect(result.errors.single, contains('tekrar'));
  });

  test('eksik başlıkları raporlar', () {
    final result = CsvImportParser.parse('name,amount\nNetflix,10');
    expect(result.rows, isEmpty);
    expect(result.errors.single, contains('Eksik başlık'));
  });

  test('geçersiz satırı atlayıp diğerini korur', () {
    final result = CsvImportParser.parse(
      'name,amount,currency,billing_cycle,next_renewal_date,category\n'
      'Bad,0,TRY,monthly,nope,other\n'
      'Spotify,20,TRY,yearly,2026-11-01,music',
    );
    expect(result.rows, hasLength(1));
    expect(result.rows.single.billingCycle.name, 'yearly');
    expect(result.errors, hasLength(1));
  });
}
