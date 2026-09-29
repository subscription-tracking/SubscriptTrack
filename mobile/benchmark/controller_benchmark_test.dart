// ignore_for_file: invalid_use_of_visible_for_testing_member

// Host makinede çalışan mikro-benchmark (cihaz ölçümü DEĞİLDİR).
// Çalıştırma: flutter test benchmark/controller_benchmark_test.dart
// Sonuç: ../code-review-report/metrics/benchmark.json
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/reminder_planner.dart';
import 'package:subscript_track/features/stats/domain/payment_event.dart';
import 'package:subscript_track/features/stats/domain/stats_view_model.dart';
import 'package:subscript_track/features/stats/presentation/screens/stats_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_list_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_list_view_model.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/list/subscription_tile.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

class _Repo implements SubscriptionDataSource {
  _Repo(this.items);
  final List<Subscription> items;

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(items);
  @override
  Future<Subscription> update(Subscription updated) async => updated;
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
  Future<void> delete(String u, String id) async {}
  @override
  Future<void> archive(String u, String id) async {}
  @override
  Future<void> restore(String u, String id) async {}
  @override
  Future<void> pause(String u, String id) async {}
  @override
  Future<void> resume(String u, String id) async {}
  @override
  Future<void> cancel(String u, String id) async {}
}

List<Subscription> _subs(int n) => List.generate(n, (i) {
      final now = DateTime.now();
      return Subscription(
        id: 's$i',
        userId: 'u',
        name: 'Servis $i',
        amount: Money.parse('${9 + i % 90}.99'),
        currency: i % 5 == 0 ? 'USD' : 'TRY',
        billingCycle: BillingCycle.values[i % BillingCycle.values.length],
        startDate: now.subtract(Duration(days: 40 + i % 300)),
        nextRenewalDate: now.add(Duration(days: 1 + i % 60)),
        category:
            SubscriptionCategory.values[i % SubscriptionCategory.values.length],
        createdAt: now,
      );
    });

double _median(List<int> micros) {
  final s = [...micros]..sort();
  final mid = s.length ~/ 2;
  final v = s.length.isOdd ? s[mid].toDouble() : (s[mid - 1] + s[mid]) / 2;
  return double.parse((v / 1000).toStringAsFixed(2)); // ms
}

Future<double> _time(int runs, Future<void> Function() body) async {
  final samples = <int>[];
  for (var i = 0; i < runs; i++) {
    final sw = Stopwatch()..start();
    await body();
    sw.stop();
    samples.add(sw.elapsedMicroseconds);
  }
  return _median(samples);
}

void main() {
  const n = 1000;
  final results = <String, Object>{'subscriptions': n};

  setUpAll(() {
    tzdata.initializeTimeZones();
  });

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('controller.load() ve selector yeniden hesabı — ölçek tablosu',
      () async {
    final scaling = <String, Object>{};
    for (final size in [50, 200, n]) {
      final subs = _subs(size);
      final load = await _time(7, () async {
        final c = SubscriptionController(userId: 'u', repository: _Repo(subs));
        await c.load();
        c.dispose();
      });
      final c = SubscriptionController(userId: 'u', repository: _Repo(subs));
      await c.load();
      final notify = await _time(30, () async {
        c.clearError(); // notifyListeners → selector'lar sıfırlanır
        c.active;
        c.trials;
        c.paused;
        c.cancelled;
        c.expired;
        c.archived;
        c.totalsByCurrency;
      });
      final projected = await _time(3, () async => c.projectedRenewals());
      scaling['$size'] = {
        'load_ms': load,
        'notify_selectors_ms': notify,
        // UI'da şu an çağrılmıyor (yalnızca testlerde); yine de ölçülür.
        'projected_renewals_unused_by_ui_ms': projected,
      };
      if (size == n) {
        results['controller_load_ms'] = load;
        results['notify_selectors_ms'] = notify;
        results['projected_renewals_unused_by_ui_ms'] = projected;
      }
    }
    results['scaling'] = scaling;
  });

  test('saf hesaplar (medyan ms)', () async {
    final subs = _subs(n);
    final now = DateTime.now();
    final events = List.generate(
      2000,
      (i) => PaymentEvent(
        id: 'e$i',
        subscriptionId: 's${i % n}',
        amount: Money.parse('${10 + i % 50}.00'),
        currency: i % 5 == 0 ? 'USD' : 'TRY',
        paidAt: now.subtract(Duration(days: i % 200)),
      ),
    );
    final totals = {'TRY': Money.parse('1000'), 'USD': Money.parse('200')};
    results['stats_view_model_ms'] = await _time(
      15,
      () async => StatsViewModel.build(
        totals: totals,
        active: subs,
        paymentEvents: events,
      ),
    );
    results['list_filter_sort_ms'] = await _time(
      30,
      () async => filterAndSortSubscriptions(
        subs,
        query: 'servis 1',
        sort: SubscriptionSortOption.amountDesc,
      ),
    );
    final location = tz.getLocation('Europe/Istanbul');
    final tzNow = tz.TZDateTime.now(location);
    results['reminder_planner_ms'] = await _time(
      15,
      () async => ReminderPlanner.plan(
        subscriptions: subs,
        daysBefore: 3,
        location: location,
        now: tzNow,
      ),
    );
  });

  testWidgets(
      'widget pump süresi — Stats(200) ve Liste(1000) (test ortamı, ms)',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final stats =
        SubscriptionController(userId: 'u', repository: _Repo(_subs(200)));
    await stats.load();
    final samplesStats = <int>[];
    for (var i = 0; i < 5; i++) {
      final sw = Stopwatch()..start();
      await tester
          .pumpWidget(MaterialApp(home: StatsScreen(controller: stats)));
      await tester.pump();
      sw.stop();
      samplesStats.add(sw.elapsedMicroseconds);
    }
    results['stats_screen_pump_200_ms'] = _median(samplesStats);

    final list =
        SubscriptionController(userId: 'u', repository: _Repo(_subs(n)));
    await list.load();
    final samplesList = <int>[];
    for (var i = 0; i < 5; i++) {
      final sw = Stopwatch()..start();
      await tester.pumpWidget(MaterialApp(
        home: ChangeNotifierProvider<SubscriptionController>.value(
          value: list,
          child: const SubscriptionListScreen(),
        ),
      ));
      await tester.pump();
      sw.stop();
      samplesList.add(sw.elapsedMicroseconds);
    }
    results['list_screen_pump_1000_ms'] = _median(samplesList);
    results['list_screen_built_tiles'] =
        find.byType(SubscriptionListTile).evaluate().length;
  });

  tearDownAll(() {
    results['note'] =
        'Host makine mikro-benchmarkı; cihaz/frame süresi değildir. Medyan, milisaniye.';
    final file = File('../code-review-report/metrics/benchmark.json');
    file.writeAsStringSync(const JsonEncoder.withIndent(' ').convert(results));
  });
}
