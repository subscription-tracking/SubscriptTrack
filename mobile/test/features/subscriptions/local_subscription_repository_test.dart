import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/data/local_subscription_repository.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('eşzamanlı yerel create çağrıları kayıt kaybetmez', () async {
    final repository = LocalSubscriptionRepository();
    final results = await Future.wait(
      List.generate(
        8,
        (index) => repository.create(
          userId: 'user-1',
          name: 'Abonelik $index',
          amount: Money.parse('${index + 10}.00'),
          currency: 'TRY',
          billingCycle: BillingCycle.monthly,
          startDate: DateTime.utc(2026, 1, 1),
          nextRenewalDate: DateTime.utc(2026, 2, 1),
          category: SubscriptionCategory.other,
        ),
      ),
    );

    final stored = await repository.getAll('user-1');
    expect(results, hasLength(8));
    expect(stored, hasLength(8));
    expect(stored.map((item) => item.id).toSet(), hasLength(8));
  });

  Future<String> createOne(
    LocalSubscriptionRepository repo, {
    String name = 'Netflix',
    DateTime? trialEnd,
    String userId = 'user-1',
  }) async {
    final sub = await repo.create(
      userId: userId,
      name: name,
      amount: Money.parse('10'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 1, 1),
      nextRenewalDate: DateTime.utc(2026, 2, 1),
      category: SubscriptionCategory.streaming,
      notes: '  not  ',
      paymentMethod: ' Kart ',
      trialEndDate: trialEnd,
    );
    return sub.id;
  }

  test('create: ad/not kırpılır; deneme tarihi varsa trial durumu', () async {
    final repo = LocalSubscriptionRepository();
    final id = await repo.create(
      userId: 'user-1',
      name: '  Netflix  ',
      amount: Money.parse('10'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 1, 1),
      nextRenewalDate: DateTime.utc(2026, 2, 1),
      category: SubscriptionCategory.streaming,
      notes: '  not  ',
      paymentMethod: ' Kart ',
      trialEndDate: DateTime.utc(2026, 1, 15),
    );
    expect(id.name, 'Netflix');
    expect(id.notes, 'not');
    expect(id.paymentMethod, 'Kart');
    expect(id.status, SubscriptionStatus.trial);

    final plain = await repo.create(
      userId: 'user-1',
      name: 'Düz',
      amount: Money.parse('1'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 1, 1),
      nextRenewalDate: DateTime.utc(2026, 2, 1),
      category: SubscriptionCategory.other,
    );
    expect(plain.status, SubscriptionStatus.active);
  });

  test('kullanıcılar birbirinin aboneliğini görmez', () async {
    final repo = LocalSubscriptionRepository();
    await createOne(repo, userId: 'a');
    expect(await repo.getAll('b'), isEmpty);
    expect(await repo.getAll('a'), hasLength(1));
  });

  test('update kaydı değiştirir; bilinmeyen kayıt listeyi bozmaz', () async {
    final repo = LocalSubscriptionRepository();
    final id = await createOne(repo);
    final stored = (await repo.getAll('user-1')).single;

    await repo.update(stored.copyWith(name: 'Yeni ad'));
    expect((await repo.getAll('user-1')).single.name, 'Yeni ad');

    await repo.update(Subscription.fromJson({
      ...stored.toJson(),
      'id': 'yok',
      'name': 'Hayalet',
    }));
    final all = await repo.getAll('user-1');
    expect(all, hasLength(1));
    expect(all.single.id, id);
  });

  test('durum geçişleri kalıcıdır', () async {
    final repo = LocalSubscriptionRepository();
    final id = await createOne(repo);
    Future<SubscriptionStatus> status() async =>
        (await repo.getAll('user-1')).single.status;

    await repo.pause('user-1', id);
    expect(await status(), SubscriptionStatus.paused);
    await repo.resume('user-1', id);
    expect(await status(), SubscriptionStatus.active);
    await repo.cancel('user-1', id);
    expect(await status(), SubscriptionStatus.cancelled);
    await repo.restore('user-1', id);
    expect(await status(), SubscriptionStatus.active);
    await repo.archive('user-1', id);
    expect(await status(), SubscriptionStatus.archived);

    await repo.archive('user-1', 'yok'); // hata vermez
    expect(await repo.getAll('user-1'), hasLength(1));
  });

  test('delete kaydı kalıcı olarak kaldırır', () async {
    final repo = LocalSubscriptionRepository();
    final a = await createOne(repo, name: 'A');
    await createOne(repo, name: 'B');
    await repo.delete('user-1', a);
    expect((await repo.getAll('user-1')).map((s) => s.name), ['B']);
  });
}
