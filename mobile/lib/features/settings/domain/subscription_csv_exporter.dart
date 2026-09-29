import '../../../core/utils/csv_safety.dart';
import '../../subscriptions/domain/subscription_models.dart';

/// Abonelikleri, tekrar içe aktarılabilir CSV metnine çevirir.
///
/// Kullanıcı metni sütunları (ad, not, ödeme yöntemi…) formül olarak
/// çalışmasın diye etkisizleştirilir; tutar ve tarih sütunları olduğu gibi
/// yazılır (bkz. [CsvSafety]).
abstract final class SubscriptionCsvExporter {
  static const headers = [
    'name',
    'amount',
    'currency',
    'billing_cycle',
    'next_renewal_date',
    'category',
    'status',
    'notes',
    'payment_method',
    'trial_end_date',
    'trial_price_after',
  ];

  static const _eol = '\r\n';

  static String build(Iterable<Subscription> subscriptions) {
    final buffer = StringBuffer()
      ..write(headers.map((h) => CsvSafety.field(h, text: false)).join(','))
      ..write(_eol);
    for (final s in subscriptions) {
      buffer
        ..write([
          CsvSafety.field(s.name),
          CsvSafety.field(s.amount.decimalString, text: false),
          CsvSafety.field(s.currency),
          CsvSafety.field(s.billingCycle.key),
          CsvSafety.field(_date(s.nextRenewalDate), text: false),
          CsvSafety.field(s.category.key),
          CsvSafety.field(s.status.key),
          CsvSafety.field(s.notes ?? ''),
          CsvSafety.field(s.paymentMethod ?? ''),
          CsvSafety.field(
            s.trialEndDate == null ? '' : _date(s.trialEndDate!),
            text: false,
          ),
          CsvSafety.field(s.trialPriceAfter?.decimalString ?? '', text: false),
        ].join(','))
        ..write(_eol);
    }
    return buffer.toString();
  }

  static String _date(DateTime d) => d.toIso8601String().substring(0, 10);
}
