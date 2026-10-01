import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/core/services/offline_mutation_queue.dart';
import 'package:subscript_track/core/storage/local_storage.dart';
import 'package:subscript_track/features/auth/data/auth_local_state.dart';
import 'package:subscript_track/features/subscriptions/data/offline_sync_coordinator.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

/// Güvenlik regresyonu (denetim F-01): çevrimdışı kuyruk kullanıcıya özeldir.
/// Aynı cihazda kullanıcı A'nın bekleyen mutasyonları, kullanıcı B giriş
/// yaptığında B'nin hesabına yazılmamalıdır.
class _CreateRepo implements SubscriptionDataSource {
  final List<String> created = [];

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
    created.add('$userId:$name:$notes');
    return Subscription(
      id: 'server-1',
      userId: userId,
      name: name,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      createdAt: DateTime.utc(2026, 10, 1),
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => throw UnimplementedError();
}

Subscription _privateSubscription() => Subscription(
      id: 'local-1',
      userId: 'user-A',
      name: 'A-nın özel aboneliği',
      amount: Money.parse('99.00'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 8, 1),
      nextRenewalDate: DateTime.utc(2026, 10, 1),
      category: SubscriptionCategory.other,
      notes: 'A-nın gizli notu',
      createdAt: DateTime.utc(2026, 8, 1),
    );

OfflineMutation _mutation() => OfflineMutation(
      type: 'create',
      payload: _privateSubscription().toJson(),
      enqueuedAt: DateTime.utc(2026, 10, 1),
    );

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    OfflineMutationQueue.debugResetLegacyDiscard();
  });

  test('boş kullanıcı kimliği reddedilir', () {
    expect(() => OfflineMutationQueue(userId: ''), throwsArgumentError);
    expect(() => OfflineMutationQueue(userId: '   '), throwsArgumentError);
  });

  test('A kullanıcısının kuyruğu B kullanıcısına görünmez', () async {
    final a = OfflineMutationQueue(userId: 'user-A');
    await a.enqueue(_mutation());

    final b = OfflineMutationQueue(userId: 'user-B');
    expect(await b.length, 0);
    expect(await b.peek(), isNull);

    // A geri döndüğünde mutasyonu hâlâ bulur.
    final aAgain = OfflineMutationQueue(userId: 'user-A');
    expect(await aAgain.length, 1);
    expect((await aAgain.peek())!.userId, 'user-A');
  });

  test('B oturumunda replay A\'nın kaydını B hesabına yazmaz (denetim kanıtı)',
      () async {
    await OfflineMutationQueue(userId: 'user-A').enqueue(_mutation());

    final bRepo = _CreateRepo();
    final bItems = <Subscription>[];
    final b = OfflineSyncCoordinator(
      repository: bRepo,
      queue: OfflineMutationQueue(userId: 'user-B'),
      userId: 'user-B',
      items: () => bItems,
    );

    expect(await b.replay(), isFalse);
    expect(bRepo.created, isEmpty,
        reason: 'A\'nın ad ve gizli notu B hesabında oluşturulmamalı');
    expect(bItems, isEmpty);
  });

  test('A geri geldiğinde kendi mutasyonu oynatılır', () async {
    await OfflineMutationQueue(userId: 'user-A').enqueue(_mutation());

    final aRepo = _CreateRepo();
    final a = OfflineSyncCoordinator(
      repository: aRepo,
      queue: OfflineMutationQueue(userId: 'user-A'),
      userId: 'user-A',
      items: () => <Subscription>[],
    );

    expect(await a.replay(), isTrue);
    expect(aRepo.created, ['user-A:A-nın özel aboneliği:A-nın gizli notu']);
  });

  test('başka kullanıcıya damgalı girdi kendi anahtarında bile oynatılmaz',
      () async {
    // Anahtar karışması senaryosu: B'nin anahtarında A damgalı bir girdi.
    final foreign = _mutation().withUser('user-A').toJson();
    FlutterSecureStorage.setMockInitialValues({
      'offline_mutation_queue_v3:user-B': jsonEncode([foreign]),
    });
    OfflineMutationQueue.debugResetLegacyDiscard();

    final b = OfflineMutationQueue(userId: 'user-B');
    expect(await b.length, 0);
  });

  test('eski global kuyruk (sahibi bilinmez) atılır, kimseye devredilmez',
      () async {
    final legacy = jsonEncode([_mutation().toJson()]);
    FlutterSecureStorage.setMockInitialValues({
      'offline_mutation_queue_v2': legacy,
    });
    SharedPreferences.setMockInitialValues({'offline_mutation_queue': legacy});
    OfflineMutationQueue.debugResetLegacyDiscard();

    final b = OfflineMutationQueue(userId: 'user-B');
    expect(await b.length, 0);

    const storage = FlutterSecureStorage();
    expect(await storage.read(key: 'offline_mutation_queue_v2'), isNull);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('offline_mutation_queue'), isNull);
  });

  test('clear() yalnızca kendi kuyruğunu siler', () async {
    final a = OfflineMutationQueue(userId: 'user-A');
    final b = OfflineMutationQueue(userId: 'user-B');
    await a.enqueue(_mutation());
    await b.enqueue(_mutation());

    await a.clear();

    expect(await a.length, 0);
    expect(await b.length, 1);
  });

  test('hesap silme yerel verilerle birlikte kuyruğu da temizler', () async {
    await OfflineMutationQueue(userId: 'user-A').enqueue(_mutation());
    await OfflineMutationQueue(userId: 'user-B').enqueue(_mutation());

    await AuthLocalState.wipeAccountData(
      storage: LocalStorage.instance,
      userId: 'user-A',
      preferences: InMemoryAppPreferences(),
    );

    expect(await OfflineMutationQueue(userId: 'user-A').length, 0);
    expect(await OfflineMutationQueue(userId: 'user-B').length, 1);
  });
}
