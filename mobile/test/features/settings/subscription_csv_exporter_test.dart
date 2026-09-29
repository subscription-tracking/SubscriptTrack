import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/settings/domain/subscription_csv_exporter.dart';
import 'package:subscript_track/features/subscriptions/data/csv_import_parser.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _sub({
  String name = 'Netflix',
  String? notes,
  String? paymentMethod,
  String amount = '99.90',
  DateTime? trialEnd,
}) =>
    Subscription(
      id: 'id-$name',
      userId: 'u',
      name: name,
      amount: Money.parse(amount),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: DateTime(2026, 10, 5),
      category: SubscriptionCategory.streaming,
      notes: notes,
      paymentMethod: paymentMethod,
      trialEndDate: trialEnd,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  test('başlık satırı ve bir abonelik satırı üretir', () {
    final csv = SubscriptionCsvExporter.build([_sub()]);
    final lines = csv.split('\r\n');
    expect(lines.first, contains('"name","amount"'));
    expect(lines[1],
        '"Netflix","99.90","TRY","monthly","2026-10-05","streaming","active","","","",""');
    expect(lines.last, isEmpty, reason: 'satır sonu CRLF ile biter');
  });

  test('formül gibi görünen ad, not ve ödeme yöntemi etkisizleştirilir', () {
    final csv = SubscriptionCsvExporter.build([
      _sub(
        name: '=HYPERLINK("http://kotu.example","Tikla")',
        notes: '+cmd|\' /C calc\'!A0',
        paymentMethod: '@SUM(1+1)',
      ),
    ]);
    final row = csv.split('\r\n')[1];
    expect(
        row, startsWith('"\'=HYPERLINK(""http://kotu.example"",""Tikla"")"'));
    expect(row, contains('"\'+cmd|\' /C calc\'!A0"'));
    expect(row, contains('"\'@SUM(1+1)"'));
  });

  test('tutar ve tarih sütunları etkilenmez', () {
    final csv = SubscriptionCsvExporter.build([
      _sub(amount: '10.50', trialEnd: DateTime(2026, 11, 1)),
    ]);
    final row = csv.split('\r\n')[1];
    expect(row, contains('"10.50"'));
    expect(row, contains('"2026-11-01"'));
    expect(row, isNot(contains("\"'2026")));
  });

  test('dışa aktar → içe aktar gidiş-dönüşü metni korur', () {
    const name = '=1+1';
    final csv = SubscriptionCsvExporter.build([
      _sub(name: name, notes: '-özel not', paymentMethod: '@kart'),
    ]);
    final result = CsvImportParser.parse(csv);
    expect(result.errors, isEmpty);
    final row = result.rows.single;
    expect(row.name, name);
    expect(row.notes, '-özel not');
    expect(row.paymentMethod, '@kart');
    expect(row.amount, Money.parse('99.90'));
  });

  test('boş liste yalnızca başlık üretir', () {
    final csv = SubscriptionCsvExporter.build(const []);
    expect(csv.split('\r\n').where((l) => l.isNotEmpty), hasLength(1));
  });
}
