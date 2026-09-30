import '../../../core/domain/money.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../notifications/domain/notification_rule.dart';
import 'subscription_enums.dart';

export 'subscription_enums.dart';

class Subscription {
  const Subscription({
    required this.id,
    required this.userId,
    required this.name,
    required this.amount,
    required this.currency,
    required this.billingCycle,
    required this.startDate,
    required this.nextRenewalDate,
    required this.category,
    this.notes,
    this.paymentMethod,
    this.trialEndDate,
    this.trialPriceAfter,
    this.notificationRules = const [NotificationRule(daysBefore: 3)],
    this.status = SubscriptionStatus.active,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String name;
  final Money amount;
  final String currency;
  final BillingCycle billingCycle;
  final DateTime startDate;
  final DateTime nextRenewalDate;
  final SubscriptionCategory category;
  final String? notes;
  final String? paymentMethod;
  final DateTime? trialEndDate;
  final Money? trialPriceAfter;
  final List<NotificationRule> notificationRules;
  final SubscriptionStatus status;
  final DateTime createdAt;

  bool get isTrial => status == SubscriptionStatus.trial;
  bool get isExpired => status == SubscriptionStatus.expired;

  /// Derived presentation state; the persisted lifecycle status stays intact.
  bool isNotStartedAt(DateTime now) {
    if (status != SubscriptionStatus.active &&
        status != SubscriptionStatus.trial) {
      return false;
    }
    final today = DateTime(now.year, now.month, now.day);
    final start = DateTime(startDate.year, startDate.month, startDate.day);
    return start.isAfter(today);
  }

  bool get isNotStarted => isNotStartedAt(DateTime.now());

  bool get isArchived => status == SubscriptionStatus.archived;

  Money get monthlyAmount => switch (billingCycle) {
        BillingCycle.weekly => amount * 52 / 12,
        BillingCycle.monthly => amount,
        BillingCycle.quarterly => amount / 3,
        BillingCycle.yearly => amount / 12,
      };

  int get daysUntilRenewal {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final renewal = DateTime(
        nextRenewalDate.year, nextRenewalDate.month, nextRenewalDate.day);
    return renewal.difference(today).inDays;
  }

  /// Future renewal projections for planning only. These are not payments.
  List<DateTime> projectedRenewals({int count = 12}) {
    final dates = <DateTime>[];
    var current = nextRenewalDate;
    for (var i = 0; i < count; i++) {
      dates.add(current);
      current = DateTimeUtils.nextRenewalDate(
        current,
        billingCycle.key,
        anchorDate: startDate,
      );
    }
    return dates;
  }

  Subscription copyWith({
    String? name,
    Money? amount,
    String? currency,
    BillingCycle? billingCycle,
    DateTime? startDate,
    DateTime? nextRenewalDate,
    SubscriptionCategory? category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
    List<NotificationRule>? notificationRules,
    SubscriptionStatus? status,
  }) =>
      Subscription(
        id: id,
        userId: userId,
        name: name ?? this.name,
        amount: amount ?? this.amount,
        currency: currency ?? this.currency,
        billingCycle: billingCycle ?? this.billingCycle,
        startDate: startDate ?? this.startDate,
        nextRenewalDate: nextRenewalDate ?? this.nextRenewalDate,
        category: category ?? this.category,
        notes: notes ?? this.notes,
        paymentMethod: paymentMethod ?? this.paymentMethod,
        trialEndDate: trialEndDate ?? this.trialEndDate,
        trialPriceAfter: trialPriceAfter ?? this.trialPriceAfter,
        notificationRules: notificationRules ?? this.notificationRules,
        status: status ?? this.status,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'amount': amount.toJson(),
        'currency': currency,
        'billingCycle': billingCycle.key,
        'startDate': startDate.toIso8601String(),
        'nextRenewalDate': nextRenewalDate.toIso8601String(),
        'category': category.key,
        'notes': notes,
        'paymentMethod': paymentMethod,
        'trialEndDate': trialEndDate?.toIso8601String(),
        'trialPriceAfter': trialPriceAfter?.toJson(),
        'notificationRules': notificationRules.map((r) => r.toJson()).toList(),
        'status': status.key,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Subscription.fromJson(Map<String, dynamic> json) {
    final trialPrice = _pick(json, 'trialPriceAfter', 'trial_price_after');
    return Subscription(
      id: (json['id'] ?? '') as String,
      userId: _text(json, 'userId', 'user_id'),
      name: (json['name'] ?? '') as String,
      amount: Money.fromJson(json['amount']),
      currency: json['currency'] as String? ?? 'TRY',
      billingCycle: BillingCycleLabel.fromKey(
        _text(json, 'billingCycle', 'billing_cycle', 'monthly'),
      ),
      startDate: _date(json, 'startDate', 'start_date') ?? DateTime.now(),
      nextRenewalDate:
          _date(json, 'nextRenewalDate', 'next_renewal_date') ?? DateTime.now(),
      category: SubscriptionCategoryLabel.fromKey(
        (json['category'] ?? 'other') as String,
      ),
      notes: json['notes'] as String?,
      paymentMethod: _pick(json, 'paymentMethod', 'payment_method') as String?,
      trialEndDate: _date(json, 'trialEndDate', 'trial_end_date'),
      trialPriceAfter: trialPrice == null ? null : Money.fromJson(trialPrice),
      notificationRules: _rules(json),
      status: _status(json),
      createdAt:
          _date(json, 'createdAt', 'created_at') ?? DateTime.now().toUtc(),
    );
  }

  /// camelCase anahtar yoksa snake_case anahtara düşer.
  static Object? _pick(Map<String, dynamic> json, String camel, String snake) =>
      json[camel] ?? json[snake];

  static String _text(
    Map<String, dynamic> json,
    String camel,
    String snake, [
    String fallback = '',
  ]) =>
      (_pick(json, camel, snake) ?? fallback) as String;

  static DateTime? _date(
          Map<String, dynamic> json, String camel, String snake) =>
      DateTime.tryParse(_text(json, camel, snake));

  static List<NotificationRule> _rules(Map<String, dynamic> json) =>
      (_pick(json, 'notificationRules', 'notification_rules') as List<dynamic>?)
          ?.whereType<Map<String, dynamic>>()
          .map(NotificationRule.fromJson)
          .toList() ??
      const [NotificationRule(daysBefore: 3)];

  /// Eski kayıtlarda `status` yoktur; `isArchived` bayrağından türetilir.
  static SubscriptionStatus _status(Map<String, dynamic> json) {
    final key = json['status'] as String?;
    if (key != null) return SubscriptionStatusExt.fromKey(key);
    return (_pick(json, 'isArchived', 'is_archived') as bool? ?? false)
        ? SubscriptionStatus.archived
        : SubscriptionStatus.active;
  }
}
