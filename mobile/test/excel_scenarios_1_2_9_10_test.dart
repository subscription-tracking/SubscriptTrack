import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

class _RecordingRepository implements SubscriptionDataSource {
  final List<Subscription> items = [];

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(items);

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
    final item = Subscription(
      id: 'record-${items.length + 1}',
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
      createdAt: DateTime.utc(2026, 9, 19),
    );
    items.add(item);
    return item;
  }

  @override
  Future<Subscription> update(Subscription updated) async => updated;
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
  test(
      'TEST 1 — geçerli alanlarla eklenen abonelik, repository payload’ında aynen korunur',
      () async {
    final repository = _RecordingRepository();
    final controller = SubscriptionController(
      userId: 'scenario-1-user',
      repository: repository,
    );
    final start = DateTime.utc(2026, 9, 20);
    final renewal = DateTime.utc(2026, 10, 20);

    final added = await controller.add(
      name: 'Netflix',
      amount: Money.parse('279.99'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: start,
      nextRenewalDate: renewal,
      category: SubscriptionCategory.streaming,
      notes: 'Aile planı',
    );

    expect(added, isTrue);
    expect(repository.items, hasLength(1));
    final stored = repository.items.single;
    expect(stored.name, 'Netflix');
    expect(stored.amount, Money.parse('279.99'));
    expect(stored.currency, 'TRY');
    expect(stored.billingCycle, BillingCycle.monthly);
    expect(stored.startDate, start);
    expect(stored.nextRenewalDate, renewal);
    expect(stored.category, SubscriptionCategory.streaming);
    expect(stored.notes, 'Aile planı');
  });

  testWidgets('TEST 2 — boş abonelik adı form doğrulamasını geçmez',
      (tester) async {
    final key = GlobalKey<FormState>();
    final data = SubscriptionFormData(amount: '25');
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: SubscriptionForm(formKey: key, data: data),
        ),
      ),
    ));

    expect(key.currentState!.validate(), isFalse);
    await tester.pump();
    expect(find.text('Ad boş olamaz'), findsOneWidget);
  });

  test(
      'TEST 9 — TRY, USD ve EUR kayıtları para birimlerini dönüştürmeden saklar',
      () async {
    final repository = _RecordingRepository();
    final controller = SubscriptionController(
      userId: 'scenario-9-user',
      repository: repository,
    );
    for (final entry
        in {'TRY': '100.00', 'USD': '20.00', 'EUR': '30.00'}.entries) {
      await controller.add(
        name: 'Plan ${entry.key}',
        amount: Money.parse(entry.value),
        currency: entry.key,
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2026, 9, 1),
        nextRenewalDate: DateTime(2026, 10, 1),
        category: SubscriptionCategory.other,
      );
    }

    expect(
        repository.items.map((item) => item.currency), ['TRY', 'USD', 'EUR']);
    expect(
        controller.totalsByCurrency.keys, containsAll(['TRY', 'USD', 'EUR']));
    expect(controller.totalsByCurrency['TRY'], Money.parse('100.00'));
    expect(controller.totalsByCurrency['USD'], Money.parse('20.00'));
    expect(controller.totalsByCurrency['EUR'], Money.parse('30.00'));
  });

  test('TEST 10 — seçilen kategori ekleme akışında kalıcı olarak saklanır',
      () async {
    final repository = _RecordingRepository();
    final controller = SubscriptionController(
      userId: 'scenario-10-user',
      repository: repository,
    );

    await controller.add(
      name: 'Figma',
      amount: Money.parse('15.00'),
      currency: 'USD',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 9, 1),
      nextRenewalDate: DateTime(2026, 10, 1),
      category: SubscriptionCategory.software,
    );

    expect(repository.items.single.category, SubscriptionCategory.software);
    expect(controller.allItems.single.category, SubscriptionCategory.software);
  });
}
