import '../../../core/domain/money.dart';

enum SubscriptionStatus { active, paused, cancelled, archived }

extension SubscriptionStatusExt on SubscriptionStatus {
  String get label => switch (this) {
        SubscriptionStatus.active => 'Aktif',
        SubscriptionStatus.paused => 'Duraklatıldı',
        SubscriptionStatus.cancelled => 'İptal edildi',
        SubscriptionStatus.archived => 'Arşivlendi',
      };

  String get key => name;

  static SubscriptionStatus fromKey(String key) =>
      SubscriptionStatus.values.firstWhere((e) => e.key == key,
          orElse: () => SubscriptionStatus.active);

  // Valid backend status transitions (mirrors server-side rules).
  static const _allowed = <SubscriptionStatus, Set<SubscriptionStatus>>{
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

  static BillingCycle fromKey(String key) =>
      BillingCycle.values.firstWhere((e) => e.key == key,
          orElse: () => BillingCycle.monthly);
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
  final SubscriptionStatus status;
  final DateTime createdAt;

  bool get isArchived => status == SubscriptionStatus.archived;

  Money get monthlyAmount => switch (billingCycle) {
        BillingCycle.weekly => amount * 4.33,
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

  Subscription copyWith({
    String? name,
    Money? amount,
    String? currency,
    BillingCycle? billingCycle,
    DateTime? startDate,
    DateTime? nextRenewalDate,
    SubscriptionCategory? category,
    String? notes,
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
            (json['nextRenewalDate'] ?? json['next_renewal_date'] ?? '') as String,
          ) ??
          DateTime.now(),
      category: SubscriptionCategoryLabel.fromKey(
        (json['category'] ?? 'other') as String,
      ),
      notes: json['notes'] as String?,
      status: status,
      createdAt: DateTime.tryParse(
            (json['createdAt'] ?? json['created_at'] ?? '') as String,
          ) ??
          DateTime.now().toUtc(),
    );
  }
}
