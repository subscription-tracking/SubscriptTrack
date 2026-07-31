enum BillingCycle { weekly, monthly, quarterly, yearly }

extension BillingCycleLabel on BillingCycle {
  String get label => switch (this) {
        BillingCycle.weekly => 'Haftalık',
        BillingCycle.monthly => 'Aylık',
        BillingCycle.quarterly => '3 Aylık',
        BillingCycle.yearly => 'Yıllık',
      };

  // Kaç günde bir yineleniyor
  int get intervalDays => switch (this) {
        BillingCycle.weekly => 7,
        BillingCycle.monthly => 30,
        BillingCycle.quarterly => 90,
        BillingCycle.yearly => 365,
      };

  // Supabase / JSON için string key
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
    required this.nextRenewalDate,
    required this.category,
    this.notes,
    this.isArchived = false,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String name;
  final double amount;
  final String currency;
  final BillingCycle billingCycle;
  final DateTime nextRenewalDate;
  final SubscriptionCategory category;
  final String? notes;
  final bool isArchived;
  final DateTime createdAt;

  // Aylık normalize edilmiş tutar (dashboard toplamı için)
  double get monthlyAmount => switch (billingCycle) {
        BillingCycle.weekly => amount * 4.33,
        BillingCycle.monthly => amount,
        BillingCycle.quarterly => amount / 3,
        BillingCycle.yearly => amount / 12,
      };

  int get daysUntilRenewal =>
      nextRenewalDate.difference(DateTime.now()).inDays;

  Subscription copyWith({
    String? name,
    double? amount,
    String? currency,
    BillingCycle? billingCycle,
    DateTime? nextRenewalDate,
    SubscriptionCategory? category,
    String? notes,
    bool? isArchived,
  }) =>
      Subscription(
        id: id,
        userId: userId,
        name: name ?? this.name,
        amount: amount ?? this.amount,
        currency: currency ?? this.currency,
        billingCycle: billingCycle ?? this.billingCycle,
        nextRenewalDate: nextRenewalDate ?? this.nextRenewalDate,
        category: category ?? this.category,
        notes: notes ?? this.notes,
        isArchived: isArchived ?? this.isArchived,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'amount': amount,
        'currency': currency,
        'billingCycle': billingCycle.key,
        'nextRenewalDate': nextRenewalDate.toIso8601String(),
        'category': category.key,
        'notes': notes,
        'isArchived': isArchived,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        id: json['id'] as String,
        userId: json['userId'] as String,
        name: json['name'] as String,
        amount: (json['amount'] as num).toDouble(),
        currency: json['currency'] as String? ?? '₺',
        billingCycle:
            BillingCycleLabel.fromKey(json['billingCycle'] as String),
        nextRenewalDate:
            DateTime.parse(json['nextRenewalDate'] as String),
        category: SubscriptionCategoryLabel.fromKey(
            json['category'] as String),
        notes: json['notes'] as String?,
        isArchived: json['isArchived'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
