import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/services/offline_mutation_queue.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _Repo implements SubscriptionDataSource {
  _Repo(this.items);

  final List<Subscription> items;
  bool offline = false;

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(items);

  @override
  Future<Subscription> update(Subscription updated) async {
    if (offline) throw const NetworkException('offline');
    final i = items.indexWhere((s) => s.id == updated.id);
    if (i != -1) items[i] = updated;
    return updated;
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
  }) =>
      throw UnimplementedError();

  @override
  Future<void> delete(String userId, String id) async {}
  @override
  Future<void> archive(String userId, String id) async {}
  @override
  Future<void> restore(String userId, String id) async {}
  @override
  Future<void> pause(String userId, String id) async {}
  @override
  Future<void> resume(String userId, String id) async {}
  @override
  Future<void> cancel(String userId, String id) async {}
}

Subscription _endedTrial() {
  final ended = DateTime.now().subtract(const Duration(days: 3));
  return Subscription(
    id: 'trial-1',
    userId: 'u',
    name: 'Trial',
    amount: Money.parse('10'),
    currency: 'TRY',
    billingCycle: BillingCycle.monthly,
    startDate: ended.subtract(const Duration(days: 7)),
    nextRenewalDate: ended,
    category: SubscriptionCategory.other,
    status: SubscriptionStatus.trial,
    trialEndDate: ended,
    createdAt: ended,
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test(
      'çevrimdışı deneme bitişi kuyruğu tıkamaz: update olarak kuyruğa alınır '
      've bağlantı gelince uygulanır', () async {
    final repo = _Repo([_endedTrial()])..offline = true;
    final controller = SubscriptionController(userId: 'u', repository: repo);

    await controller.load();
    expect(controller.expired.single.id, 'trial-1');
    expect(await OfflineMutationQueue(userId: 'u').length, 1);
    expect((await OfflineMutationQueue(userId: 'u').peek())!.type, 'update');

    repo.offline = false;
    await controller.load();
    expect(await OfflineMutationQueue(userId: 'u').isEmpty, isTrue);
    expect(repo.items.single.status, SubscriptionStatus.expired);
  });
}
