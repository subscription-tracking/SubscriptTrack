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

  test('takvimde olmayan ISO tarihi normalleştirmeden reddeder', () {
    final result = CsvImportParser.parse(
      'name,amount,currency,billing_cycle,next_renewal_date,category\n'
      'Bad,10,TRY,monthly,2026-02-30,other\n'
      'Good,20,TRY,monthly,2026-02-28,other',
    );

    expect(result.rows.map((row) => row.name), ['Good']);
    expect(result.errors.single, contains('tarih geçersiz'));
  });

  test('dışa aktarma şemasındaki isteğe bağlı alanları korur', () {
    final result = CsvImportParser.parse(
      'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after\n'
      'Netflix,149.99,TRY,monthly,2026-10-16,streaming,paused,"Aile planı",Kart,2026-10-15,199.99',
    );

    expect(result.errors, isEmpty);
    final row = result.rows.single;
    expect(row.status.name, 'paused');
    expect(row.notes, 'Aile planı');
    expect(row.paymentMethod, 'Kart');
    expect(row.trialEndDate, DateTime(2026, 10, 15));
    expect(row.trialPriceAfter?.decimalString, '199.99');
  });
}
