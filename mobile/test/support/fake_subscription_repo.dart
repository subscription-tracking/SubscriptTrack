import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

/// Bellek içi abonelik kaynağı; testlerin ortak ihtiyacını karşılar.
class FakeSubscriptionRepo implements SubscriptionDataSource {
  FakeSubscriptionRepo([List<Subscription>? items]) : items = items ?? [];

  final List<Subscription> items;

  /// `true` iken tüm çağrılar [NetworkException] fırlatır.
  bool offline = false;
  int createCalls = 0;
  final List<String> calls = [];

  void _guard() {
    if (offline) throw const NetworkException('Ağ bağlantısı yok');
  }

  @override
  Future<List<Subscription>> getAll(String userId) async {
    _guard();
    return List.of(items);
  }

  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
  }) async {
    _guard();
    createCalls++;
    final sub = Subscription(
      id: 'srv-${items.length + 1}',
      userId: userId,
      name: name,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      notes: notes,
      paymentMethod: paymentMethod,
      trialEndDate: trialEndDate,
      trialPriceAfter: trialPriceAfter,
      createdAt: DateTime.now(),
    );
    items.add(sub);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    _guard();
    final i = items.indexWhere((s) => s.id == updated.id);
    if (i != -1) items[i] = updated;
    return updated;
  }

  void _status(String op, String id, SubscriptionStatus? status) {
    _guard();
    calls.add('$op:$id');
    final i = items.indexWhere((s) => s.id == id);
    if (i == -1) return;
    if (status == null) {
      items.removeAt(i);
    } else {
      items[i] = items[i].copyWith(status: status);
    }
  }

  @override
  Future<void> delete(String u, String id) async => _status('delete', id, null);
  @override
  Future<void> archive(String u, String id) async =>
      _status('archive', id, SubscriptionStatus.archived);
  @override
  Future<void> restore(String u, String id) async =>
      _status('restore', id, SubscriptionStatus.active);
  @override
  Future<void> pause(String u, String id) async =>
      _status('pause', id, SubscriptionStatus.paused);
  @override
  Future<void> resume(String u, String id) async =>
      _status('resume', id, SubscriptionStatus.active);
  @override
  Future<void> cancel(String u, String id) async =>
      _status('cancel', id, SubscriptionStatus.cancelled);
}

/// Test aboneliği üretir; yalnızca değişen alanlar belirtilir.
Subscription testSubscription(
  String id, {
  String? name,
  String amount = '50.00',
  String currency = 'TRY',
  SubscriptionStatus status = SubscriptionStatus.active,
  SubscriptionCategory category = SubscriptionCategory.streaming,
  BillingCycle cycle = BillingCycle.monthly,
  int daysUntilRenewal = 10,
  String? notes,
  String? paymentMethod,
}) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return Subscription(
    id: id,
    userId: 'u1',
    name: name ?? 'Servis $id',
    amount: Money.parse(amount),
    currency: currency,
    billingCycle: cycle,
    startDate: today.subtract(const Duration(days: 60)),
    nextRenewalDate: today.add(Duration(days: daysUntilRenewal)),
    category: category,
    status: status,
    notes: notes,
    paymentMethod: paymentMethod,
    createdAt: today,
  );
}
