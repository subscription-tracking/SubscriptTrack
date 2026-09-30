import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
import 'package:subscript_track/features/stats/presentation/widgets/hero_spending_card.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/detail/detail_payment_card.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

import '../support/fake_subscription_repo.dart';

Widget _host(Widget child) => MaterialApp(
      home: Scaffold(body: SingleChildScrollView(child: child)),
    );

void main() {
  group('İstatistik hero: önceki ay karşılaştırması', () {
    Widget hero(List<int> trend) => _host(HeroSpendingCard(
          monthly: Money.parse('209.98'),
          yearly: Money.parse('2519.76'),
          currency: 'TRY',
          activeCount: 2,
          trend: trend,
          hasPaymentHistory: true,
        ));

    testWidgets('önceki ayda ödeme yoksa "artış" gösterilmez', (tester) async {
      await tester.pumpWidget(hero([0, 0, 14999]));
      expect(find.textContaining('artış'), findsNothing);
      expect(find.text('Tahmini aylık gider'), findsOneWidget);
    });

    testWidgets('önceki ay varsa değişim gösterilir', (tester) async {
      await tester.pumpWidget(hero([0, 10000, 14999]));
      expect(find.textContaining('artış'), findsOneWidget);
    });
  });

  group('Abonelik formu', () {
    Future<SubscriptionFormData> pumpForm(
      WidgetTester tester, {
      bool showPresets = true,
    }) async {
      await tester.binding.setSurfaceSize(const Size(420, 2400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final data = SubscriptionFormData();
      await tester.pumpWidget(_host(SubscriptionForm(
        formKey: GlobalKey<FormState>(),
        data: data,
        showPresets: showPresets,
      )));
      return data;
    }

    testWidgets('düzenlemede (showPresets: false) popüler çipler yok',
        (tester) async {
      await pumpForm(tester, showPresets: false);
      expect(find.text('Popüler servisler'), findsNothing);
    });

    testWidgets('eklemede popüler çipler var', (tester) async {
      await pumpForm(tester);
      expect(find.text('Popüler servisler'), findsOneWidget);
    });

    testWidgets('bilinen servis adı yazılınca kategori de atanır',
        (tester) async {
      final data = await pumpForm(tester);
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Servis'), 'spotify');
      await tester.pump();
      expect(data.category, SubscriptionCategory.music);
    });

    testWidgets('bilinmeyen ad kategoriyi değiştirmez', (tester) async {
      final data = await pumpForm(tester);
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Servis'), 'Yerel Spor Salonu');
      await tester.pump();
      expect(data.category, SubscriptionCategory.other);
    });
  });

  group('Detay: sonraki ödeme', () {
    testWidgets('bugün yenilenen için tek "BUGÜN" etiketi', (tester) async {
      await tester.pumpWidget(_host(DetailNextPaymentCard(
        subscription: testSubscription('1', name: 'Netflix'),
        daysLeft: 0,
      )));
      expect(find.text('BUGÜN'), findsOneWidget);
      expect(find.text('GÜN KALDI'), findsNothing);
    });

    testWidgets('kalan gün varsa sayı ve etiket', (tester) async {
      await tester.pumpWidget(_host(DetailNextPaymentCard(
        subscription: testSubscription('1', name: 'Netflix'),
        daysLeft: 5,
      )));
      expect(find.text('5'), findsOneWidget);
      expect(find.text('GÜN KALDI'), findsOneWidget);
    });
  });

  test('DateTimeUtils.formatLongDate: gün, ay adı ve yıl', () {
    expect(
        DateTimeUtils.formatLongDate(DateTime(2026, 9, 30)), '30 Eylül 2026');
    expect(DateTimeUtils.formatLongDate(DateTime(2026, 1, 5)), '5 Ocak 2026');
  });
}
