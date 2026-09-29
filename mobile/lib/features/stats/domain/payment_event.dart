import '../../../core/domain/money.dart';

class PaymentEvent {
  const PaymentEvent(
      {required this.id,
      required this.subscriptionId,
      required this.amount,
      required this.currency,
      required this.paidAt});
  final String id;
  final String? subscriptionId;
  final Money amount;
  final String currency;
  final DateTime paidAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'subscriptionId': subscriptionId,
        'amount': amount.toJson(),
        'currency': currency,
        'paidAt': paidAt.toUtc().toIso8601String(),
      };

  factory PaymentEvent.fromJson(Map<String, dynamic> json) => PaymentEvent(
        id: json['id'] as String,
        subscriptionId: json['subscriptionId'] as String? ??
            json['subscription_id'] as String?,
        amount: Money.fromJson(json['amount']),
        currency: json['currency'] as String? ?? 'TRY',
        paidAt: DateTime.parse((json['paidAt'] ?? json['paid_at']) as String),
      );
}
