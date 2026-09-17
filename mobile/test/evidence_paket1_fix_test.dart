// PAKET 1 — DÜZELTME KANITI: SubscriptionController._catchUpOverdueRenewals()
//
// Test 45: "Otomatik yenilenen aboneliğin bir sonraki dönemi" — geçmiş
// nextRenewalDate'e sahip AKTİF bir abonelik controller.load() sonrası
// otomatik olarak bugünden sonraki en yakın yenilemeye ilerletilmeli ve
// repo'ya (backend) da yazılmalıdır.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  final List<Subscription> updateCalls = [];
  _FakeRepo(List<Subscription> data) : _data = List.of(data);

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_data);

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
  }) async =>
      throw UnimplementedError();

  @override
  Future<Subscription> update(Subscription updated) async {
    updateCalls.add(updated);
    final idx = _data.indexWhere((s) => s.id == updated.id);
    if (idx != -1) _data[idx] = updated;
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {}
  @override
  Future<void> archive(String userId, String subscriptionId) async {}
  @override
  Future<void> restore(String userId, String subscriptionId) async {}
  @override
  Future<void> pause(String userId, String subscriptionId) async {}
  @override
  Future<void> resume(String userId, String subscriptionId) async {}
  @override
  Future<void> cancel(String userId, String subscriptionId) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  test('FIXED — TEST 45: geçmişte kalan aktif aboneliğin nextRenewalDate\'i '
      'load() sonrası otomatik ilerletiliyor ve backend\'e (repo.update) yazılıyor', () async {
    final now = DateTime.now();
    final threeMonthsAgo = DateTime(now.year, now.month - 3, 15);
    final overdueSub = Subscription(
      id: 'overdue-1',
      userId: 'u1',
      name: 'Kaçırılmış Abonelik',
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: threeMonthsAgo,
      nextRenewalDate: threeMonthsAgo, // 3 ay önce yenilenmesi gerekiyordu
      category: SubscriptionCategory.other,
      status: SubscriptionStatus.active,
      createdAt: threeMonthsAgo,
    );

    final repo = _FakeRepo([overdueSub]);
    final controller = SubscriptionController(userId: 'u1', repository: repo);

    await controller.load();

    final result = controller.allItems.single;
    final today = DateTime(now.year, now.month, now.day);

    expect(result.status, SubscriptionStatus.active,
        reason: 'Abonelik "expired" olmuyor, sadece bir sonraki döneme yenileniyor.');
    expect(
      DateTime(result.nextRenewalDate.year, result.nextRenewalDate.month,
              result.nextRenewalDate.day)
          .isBefore(today),
      isFalse,
      reason: 'Eski (geçmiş) tarih artık listede KALMIYOR — bugün ya da sonrasına ilerletildi.',
    );
    expect(repo.updateCalls, isNotEmpty,
        reason: 'Yeni tarih backend\'e (repo.update) de yazıldı, sadece local state değil.');
    expect(repo.updateCalls.single.id, 'overdue-1');
  });

  test('Kontrast: nextRenewalDate zaten gelecekte olan aktif abonelik DOKUNULMADAN kalıyor', () async {
    final future = DateTime.now().add(const Duration(days: 10));
    final sub = Subscription(
      id: 'future-1', userId: 'u1', name: 'Normal', amount: Money.fromJson(50),
      currency: 'TRY', billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(), nextRenewalDate: future,
      category: SubscriptionCategory.other, status: SubscriptionStatus.active,
      createdAt: DateTime.now(),
    );
    final repo = _FakeRepo([sub]);
    final controller = SubscriptionController(userId: 'u1', repository: repo);

    await controller.load();

    expect(repo.updateCalls, isEmpty,
        reason: 'Zaten güncel olan abonelik için gereksiz bir update çağrısı yapılmadı.');
    expect(controller.allItems.single.nextRenewalDate, future);
  });

  test('Kontrast: PAUSED durumdaki geçmiş tarihli abonelik otomatik ilerletilmiyor', () async {
    final past = DateTime.now().subtract(const Duration(days: 40));
    final sub = Subscription(
      id: 'paused-1', userId: 'u1', name: 'Duraklatılmış', amount: Money.fromJson(50),
      currency: 'TRY', billingCycle: BillingCycle.monthly,
      startDate: past, nextRenewalDate: past,
      category: SubscriptionCategory.other, status: SubscriptionStatus.paused,
      createdAt: past,
    );
    final repo = _FakeRepo([sub]);
    final controller = SubscriptionController(userId: 'u1', repository: repo);

    await controller.load();

    expect(repo.updateCalls, isEmpty,
        reason: 'Sadece AKTİF abonelikler otomatik ilerletiliyor; duraklatılmış olan dokunulmadan kalıyor.');
    expect(controller.allItems.single.nextRenewalDate, past);
  });
}
