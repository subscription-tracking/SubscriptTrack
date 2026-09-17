import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/services/offline_mutation_queue.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _ReplayRepo implements SubscriptionDataSource {
  _ReplayRepo(this._items);

  final List<Subscription> _items;
  final List<String> calls = [];
  int failuresRemaining = 0;

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_items);

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
  Future<Subscription> update(Subscription updated) =>
      throw UnimplementedError();

  @override
  Future<void> delete(String userId, String subscriptionId) async =>
      _run('delete', subscriptionId, null);

  @override
  Future<void> archive(String userId, String subscriptionId) async =>
      _run('archive', subscriptionId, SubscriptionStatus.archived);

  @override
  Future<void> restore(String userId, String subscriptionId) async =>
      _run('restore', subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> pause(String userId, String subscriptionId) async =>
      _run('pause', subscriptionId, SubscriptionStatus.paused);

  @override
  Future<void> resume(String userId, String subscriptionId) async =>
      _run('resume', subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> cancel(String userId, String subscriptionId) async =>
      _run('cancel', subscriptionId, SubscriptionStatus.cancelled);

  void _run(String operation, String id, SubscriptionStatus? status) {
    calls.add(operation);
    if (failuresRemaining > 0) {
      failuresRemaining--;
      throw const NetworkException('offline');
    }
    final index = _items.indexWhere((item) => item.id == id);
    if (index == -1) return;
    if (status == null) {
      _items.removeAt(index);
    } else {
      _items[index] = _items[index].copyWith(status: status);
    }
  }
}

Subscription _subscription() => Subscription(
      id: 'sub-1',
      userId: 'user-1',
      name: 'Netflix',
      amount: Money.parse('49.90'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 8, 1),
      nextRenewalDate: DateTime.utc(2026, 9, 1),
      category: SubscriptionCategory.streaming,
      createdAt: DateTime.utc(2026, 8, 1),
    );

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('offline replay retains a failed head and preserves lifecycle order',
      () async {
    final repo = _ReplayRepo([_subscription()]);
    final controller =
        SubscriptionController(userId: 'user-1', repository: repo);
    await controller.load();

    // First two calls are the offline user actions; third is the first replay.
    repo.failuresRemaining = 3;
    await controller.pause('sub-1');
    await controller.cancel('sub-1');
    expect(controller.cancelled.single.id, 'sub-1');

    await controller.load();
    expect(await OfflineMutationQueue().length, 2);

    await controller.load();
    expect(repo.calls, ['pause', 'cancel', 'pause', 'pause', 'cancel']);
    expect(controller.cancelled.single.id, 'sub-1');
    expect(await OfflineMutationQueue().isEmpty, isTrue);
  });
}
