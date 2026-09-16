import '../../../core/domain/money.dart';
import '../domain/subscription_models.dart';

class CsvSubscriptionRow {
  const CsvSubscriptionRow(
      {required this.name,
      required this.amount,
      required this.currency,
      required this.billingCycle,
      required this.nextRenewalDate,
      required this.category});
  final String name;
  final Money amount;
  final String currency;
  final BillingCycle billingCycle;
  final DateTime nextRenewalDate;
  final SubscriptionCategory category;
}

class CsvImportResult {
  const CsvImportResult(this.rows, this.errors);
  final List<CsvSubscriptionRow> rows;
  final List<String> errors;
}

/// Beklenen başlıklar: name, amount, currency, billing_cycle,
/// next_renewal_date, category. Türkçe başlıklar da kabul edilir.
class CsvImportParser {
  static CsvImportResult parse(String input) {
    final lines = _records(input);
    if (lines.isEmpty) return const CsvImportResult([], ['CSV dosyası boş.']);
    final headers = lines.first.map((e) => _header(e)).toList();
    final required = [
      'name',
      'amount',
      'currency',
      'billing_cycle',
      'next_renewal_date',
      'category'
    ];
    final missing = required.where((h) => !headers.contains(h)).toList();
    if (missing.isNotEmpty) {
      return CsvImportResult([], ['Eksik başlık: ${missing.join(', ')}']);
    }
    final indexes = {for (final h in required) h: headers.indexOf(h)};
    final rows = <CsvSubscriptionRow>[];
    final errors = <String>[];
    final seen = <String>{};
    for (var i = 1; i < lines.length; i++) {
      final values = lines[i];
      String value(String key) =>
          indexes[key]! < values.length ? values[indexes[key]!].trim() : '';
      final name = value('name');
      final amountText = value('amount');
      final date = DateTime.tryParse(value('next_renewal_date'));
      final key = name.toLowerCase();
      if (name.isEmpty ||
          Money.parse(amountText) == Money.zero ||
          date == null) {
        errors.add('Satır ${i + 1}: ad, tutar veya tarih geçersiz.');
        continue;
      }
      if (!seen.add(key)) {
        errors.add('Satır ${i + 1}: aynı abonelik tekrar ediyor.');
        continue;
      }
      rows.add(CsvSubscriptionRow(
        name: name,
        amount: Money.parse(amountText),
        currency:
            value('currency').isEmpty ? 'TRY' : value('currency').toUpperCase(),
        billingCycle: _cycle(value('billing_cycle')),
        nextRenewalDate: date,
        category: _category(value('category')),
      ));
    }
    return CsvImportResult(rows, errors);
  }

  static List<List<String>> _records(String input) => input
      .split(RegExp(r'\r?\n'))
      .where((l) => l.trim().isNotEmpty)
      .map(_split)
      .toList();

  static List<String> _split(String line) {
    final out = <String>[];
    var current = '';
    var quoted = false;
    for (var i = 0; i < line.length; i++) {
      final c = line[i];
      if (c == '"') {
        if (quoted && i + 1 < line.length && line[i + 1] == '"') {
          current += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (c == ',' && !quoted) {
        out.add(current);
        current = '';
      } else {
        current += c;
      }
    }
    out.add(current);
    return out;
  }

  static String _header(String value) => value
      .trim()
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('ı', 'i')
      .replaceAll('ş', 's')
      .replaceAll('ğ', 'g')
      .replaceAll('ü', 'u')
      .replaceAll('ö', 'o')
      .replaceAll('ç', 'c');
  static BillingCycle _cycle(String value) => switch (_header(value)) {
        'yearly' || 'annual' || 'yillik' => BillingCycle.yearly,
        'weekly' || 'haftalik' => BillingCycle.weekly,
        'quarterly' || '3_months' || '3_aylik' => BillingCycle.quarterly,
        _ => BillingCycle.monthly
      };
  static SubscriptionCategory _category(String value) =>
      SubscriptionCategory.values.firstWhere(
          (e) => _header(e.name) == _header(value),
          orElse: () => SubscriptionCategory.other);
}
