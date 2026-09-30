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
  static const _labels = <SubscriptionCategory, String>{
    SubscriptionCategory.streaming: 'Video & Dizi',
    SubscriptionCategory.music: 'Müzik',
    SubscriptionCategory.gaming: 'Oyun',
    SubscriptionCategory.software: 'Yazılım',
    SubscriptionCategory.cloud: 'Bulut Depolama',
    SubscriptionCategory.fitness: 'Spor & Sağlık',
    SubscriptionCategory.news: 'Haber & Dergi',
    SubscriptionCategory.food: 'Yemek',
    SubscriptionCategory.education: 'Eğitim',
    SubscriptionCategory.other: 'Diğer',
  };

  String get label => _labels[this]!;

  String get key => name;

  static SubscriptionCategory fromKey(String key) =>
      SubscriptionCategory.values.firstWhere((e) => e.key == key,
          orElse: () => SubscriptionCategory.other);
}
