import '../../../core/domain/money.dart';

class SavingsEvent {
  const SavingsEvent(
      {required this.eventType,
      required this.monthlyAmount,
      required this.annualAmount,
      required this.currency,
      required this.effectiveAt});
  final String eventType;
  final Money monthlyAmount;
  final Money annualAmount;
  final String currency;
  final DateTime effectiveAt;

  Map<String, dynamic> toJson() => {
        'eventType': eventType,
        'monthlyAmount': monthlyAmount.toJson(),
        'annualAmount': annualAmount.toJson(),
        'currency': currency,
        'effectiveAt': effectiveAt.toUtc().toIso8601String(),
      };

  factory SavingsEvent.fromJson(Map<String, dynamic> json) => SavingsEvent(
        eventType: json['eventType'] as String? ??
            json['event_type'] as String? ??
            'CANCELLED',
        monthlyAmount:
            Money.fromJson(json['monthlyAmount'] ?? json['monthly_amount']),
        annualAmount:
            Money.fromJson(json['annualAmount'] ?? json['annual_amount']),
        currency: json['currency'] as String? ?? 'TRY',
        effectiveAt: DateTime.parse(
            (json['effectiveAt'] ?? json['effective_at']) as String),
      );
}
