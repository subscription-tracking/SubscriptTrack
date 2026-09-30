import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../notifications/domain/notification_rule.dart';
import '../../domain/subscription_models.dart';

enum InitialPaymentStatus { paid, unpaid, deferred }

class SubscriptionFormData {
  SubscriptionFormData({
    this.name = '',
    this.amount = '',
    String? currency,
    this.billingCycle = BillingCycle.monthly,
    DateTime? startDate,
    DateTime? nextRenewalDate,
    this.category = SubscriptionCategory.other,
    this.notes = '',
    this.paymentMethod,
    this.isTrial = false,
    this.trialEndDate,
    this.trialPriceAfter = '',
    List<NotificationRule>? notificationRules,
    this.initialPaymentStatus = InitialPaymentStatus.unpaid,
    DateTime? initialPaymentDate,
    this.deferredPaymentDate,
  })  : currency = currency ?? 'TRY',
        startDate = startDate ?? DateTime.now(),
        initialPaymentDate = initialPaymentDate ?? DateTime.now(),
        nextRenewalDate =
            nextRenewalDate ?? _defaultNextRenewalDate(startDate, billingCycle),
        notificationRules =
            notificationRules ?? [const NotificationRule(daysBefore: 3)];

  static DateTime _defaultNextRenewalDate(
    DateTime? startDate,
    BillingCycle billingCycle,
  ) {
    final start = startDate ?? DateTime.now();
    return DateTimeUtils.nextOccurrenceOnOrAfter(
      start,
      billingCycle.key,
      DateTime.now(),
      originalAnchor: start,
    );
  }

  String name;
  String amount;
  String currency;
  BillingCycle billingCycle;
  DateTime startDate;
  DateTime nextRenewalDate;
  SubscriptionCategory category;
  String notes;
  String? paymentMethod;
  bool isTrial;
  DateTime? trialEndDate;
  String trialPriceAfter;
  List<NotificationRule> notificationRules;
  InitialPaymentStatus initialPaymentStatus;
  DateTime initialPaymentDate;
  DateTime? deferredPaymentDate;

  /// Başlangıç tarihi veya fatura döngüsü değiştiğinde sonraki yenilemeyi
  /// yeniden hesaplar. Hesap UI'dan bağımsız tutulur; hem tarih seçici hem de
  /// otomatik test aynı domain kuralını kullanır.
  void recalculateNextRenewal({DateTime? now}) {
    nextRenewalDate = DateTimeUtils.nextOccurrenceOnOrAfter(
      startDate,
      billingCycle.key,
      now ?? DateTime.now(),
      originalAnchor: startDate,
    );
  }

  /// Boş/boşluklu not `null` olarak kaydedilir.
  String? get notesOrNull => notes.trim().isEmpty ? null : notes.trim();

  /// Deneme bitiş tarihi ve deneme sonrası fiyat yalnızca deneme açıkken geçerlidir.
  DateTime? get trialEndOrNull => isTrial ? trialEndDate : null;
  Money? get trialPriceOrNull => isTrial ? Money.parse(trialPriceAfter) : null;

  /// Form değerlerini [base] aboneliğine uygulayıp yeni kopyayı döndürür.
  Subscription applyTo(Subscription base) => base.copyWith(
        name: name,
        amount: Money.parse(amount),
        currency: currency,
        billingCycle: billingCycle,
        startDate: startDate,
        nextRenewalDate: nextRenewalDate,
        category: category,
        notes: notesOrNull,
        paymentMethod: paymentMethod,
        trialEndDate: trialEndOrNull,
        trialPriceAfter: trialPriceOrNull,
        notificationRules: notificationRules,
      );
}
