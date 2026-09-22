import '../../../core/domain/money.dart';
import '../domain/subscription_models.dart';

class CsvSubscriptionRow {
  const CsvSubscriptionRow(
      {required this.name,
      required this.amount,
      required this.currency,
      required this.billingCycle,
      required this.nextRenewalDate,
      required this.category,
      this.status = SubscriptionStatus.active,
      this.notes,
      this.paymentMethod,
      this.trialEndDate,
      this.trialPriceAfter});
  final String name;
  final Money amount;
  final String currency;
  final BillingCycle billingCycle;
  final DateTime nextRenewalDate;
  final SubscriptionCategory category;
  final SubscriptionStatus status;
  final String? notes;
  final String? paymentMethod;
  final DateTime? trialEndDate;
  final Money? trialPriceAfter;
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
    final indexes = {
      for (final h in [
        ...required,
        'status',
        'notes',
        'payment_method',
        'trial_end_date',
        'trial_price_after'
      ])
        h: headers.indexOf(h),
    };
    final rows = <CsvSubscriptionRow>[];
    final errors = <String>[];
    final seen = <String>{};
    for (var i = 1; i < lines.length; i++) {
      final values = lines[i];
      String value(String key) {
        final index = indexes[key] ?? -1;
        return index >= 0 && index < values.length ? values[index].trim() : '';
      }

      final name = value('name');
      final amountText = value('amount');
      final date = _parseStrictIsoDate(value('next_renewal_date'));
      final trialEndDate = _optionalDate(value('trial_end_date'));
      final key = name.toLowerCase();
      if (name.isEmpty ||
          Money.parse(amountText) == Money.zero ||
          date == null ||
          (value('trial_end_date').trim().isNotEmpty && trialEndDate == null)) {
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
        status: _status(value('status')),
        notes: _emptyAsNull(value('notes')),
        paymentMethod: _emptyAsNull(value('payment_method')),
        trialEndDate: trialEndDate,
        trialPriceAfter: _optionalMoney(value('trial_price_after')),
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

  /// DateTime.tryParse taşan günleri (ör. 2026-02-30) sonraki aya
  /// normalleştirebilir. İçe aktarmada kullanıcı girdisi takvimde gerçekten
  /// var olan `YYYY-MM-DD` tarihi olmalıdır.
  static DateTime? _parseStrictIsoDate(String value) {
    final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(value);
    if (match == null) return null;
    final year = int.parse(match.group(1)!);
    final month = int.parse(match.group(2)!);
    final day = int.parse(match.group(3)!);
    final parsed = DateTime(year, month, day);
    return parsed.year == year && parsed.month == month && parsed.day == day
        ? parsed
        : null;
  }

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

  static SubscriptionStatus _status(String value) =>
      SubscriptionStatusExt.fromKey(_header(value));

  static String? _emptyAsNull(String value) =>
      value.trim().isEmpty ? null : value.trim();

  static DateTime? _optionalDate(String value) =>
      value.trim().isEmpty ? null : _parseStrictIsoDate(value);

  static Money? _optionalMoney(String value) =>
      value.trim().isEmpty ? null : Money.parse(value);
}
