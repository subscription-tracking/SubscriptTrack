import '../../../core/domain/money.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../notifications/domain/notification_rule.dart';

enum SubscriptionStatus { trial, active, paused, cancelled, expired, archived }

extension SubscriptionStatusExt on SubscriptionStatus {
  String get label => switch (this) {
        SubscriptionStatus.trial => 'Deneme',
        SubscriptionStatus.active => 'Aktif',
        SubscriptionStatus.paused => 'Duraklatıldı',
        SubscriptionStatus.cancelled => 'İptal edildi',
        SubscriptionStatus.expired => 'Süresi doldu',
        SubscriptionStatus.archived => 'Arşivlendi',
      };

  String get key => name;

  static SubscriptionStatus fromKey(String key) => SubscriptionStatus.values
      .firstWhere((e) => e.key == key, orElse: () => SubscriptionStatus.active);

  // Valid backend status transitions (mirrors server-side rules).
  static const _allowed = <SubscriptionStatus, Set<SubscriptionStatus>>{
    SubscriptionStatus.trial: {
      SubscriptionStatus.active,
      SubscriptionStatus.cancelled,
      SubscriptionStatus.expired,
      SubscriptionStatus.archived,
    },
    SubscriptionStatus.active: {
      SubscriptionStatus.paused,
      SubscriptionStatus.cancelled,
      SubscriptionStatus.archived,
    },
    SubscriptionStatus.paused: {
      SubscriptionStatus.active,
      SubscriptionStatus.cancelled,
      SubscriptionStatus.archived,
    },
    SubscriptionStatus.cancelled: {
      SubscriptionStatus.expired,
      SubscriptionStatus.archived,
    },
    SubscriptionStatus.expired: {
      SubscriptionStatus.active,
      SubscriptionStatus.archived,
    },
    SubscriptionStatus.archived: {
      SubscriptionStatus.active,
    },
  };

  bool canTransitionTo(SubscriptionStatus next) =>
      _allowed[this]?.contains(next) ?? false;
}

enum BillingCycle { weekly, monthly, quarterly, yearly }

extension BillingCycleLabel on BillingCycle {
  String get label => switch (this) {
        BillingCycle.weekly => 'Haftalık',
        BillingCycle.monthly => 'Aylık',
        BillingCycle.quarterly => '3 Aylık',
        BillingCycle.yearly => 'Yıllık',
      };

  int get intervalDays => switch (this) {
        BillingCycle.weekly => 7,
        BillingCycle.monthly => 30,
        BillingCycle.quarterly => 90,
        BillingCycle.yearly => 365,
      };

  String get key => name;

  static BillingCycle fromKey(String key) => BillingCycle.values
      .firstWhere((e) => e.key == key, orElse: () => BillingCycle.monthly);
}

enum SubscriptionCategory {
  streaming,
  music,
  gaming,
  software,
  cloud,
  fitness,
  news,
  food,
  education,
  other,
}

extension SubscriptionCategoryLabel on SubscriptionCategory {
  String get label => switch (this) {
        SubscriptionCategory.streaming => 'Video & Dizi',
        SubscriptionCategory.music => 'Müzik',
        SubscriptionCategory.gaming => 'Oyun',
        SubscriptionCategory.software => 'Yazılım',
        SubscriptionCategory.cloud => 'Bulut Depolama',
        SubscriptionCategory.fitness => 'Spor & Sağlık',
        SubscriptionCategory.news => 'Haber & Dergi',
        SubscriptionCategory.food => 'Yemek',
        SubscriptionCategory.education => 'Eğitim',
        SubscriptionCategory.other => 'Diğer',
      };

  String get key => name;

  static SubscriptionCategory fromKey(String key) =>
      SubscriptionCategory.values.firstWhere((e) => e.key == key,
          orElse: () => SubscriptionCategory.other);
}

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
    final SubscriptionStatus status;
    if (json['status'] != null) {
      status = SubscriptionStatusExt.fromKey(json['status'] as String);
    } else {
      status = (json['isArchived'] as bool? ?? false)
          ? SubscriptionStatus.archived
          : SubscriptionStatus.active;
    }
    return Subscription(
      id: (json['id'] ?? '') as String,
      userId: (json['userId'] ?? json['user_id'] ?? '') as String,
      name: (json['name'] ?? '') as String,
      amount: Money.fromJson(json['amount']),
      currency: json['currency'] as String? ?? 'TRY',
      billingCycle: BillingCycleLabel.fromKey(
        (json['billingCycle'] ?? json['billing_cycle'] ?? 'monthly') as String,
      ),
      startDate: DateTime.tryParse(
            (json['startDate'] ?? json['start_date'] ?? '') as String,
          ) ??
          DateTime.now(),
      nextRenewalDate: DateTime.tryParse(
            (json['nextRenewalDate'] ?? json['next_renewal_date'] ?? '')
                as String,
          ) ??
          DateTime.now(),
      category: SubscriptionCategoryLabel.fromKey(
        (json['category'] ?? 'other') as String,
      ),
      notes: json['notes'] as String?,
      paymentMethod:
          (json['paymentMethod'] ?? json['payment_method']) as String?,
      trialEndDate: DateTime.tryParse(
        (json['trialEndDate'] ?? json['trial_end_date'] ?? '') as String,
      ),
      trialPriceAfter:
          (json['trialPriceAfter'] ?? json['trial_price_after']) == null
              ? null
              : Money.fromJson(
                  json['trialPriceAfter'] ?? json['trial_price_after']),
      notificationRules: ((json['notificationRules'] ??
                  json['notification_rules']) as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(NotificationRule.fromJson)
              .toList() ??
          const [NotificationRule(daysBefore: 3)],
      status: status,
      createdAt: DateTime.tryParse(
            (json['createdAt'] ?? json['created_at'] ?? '') as String,
          ) ??
          DateTime.now().toUtc(),
    );
  }
}
