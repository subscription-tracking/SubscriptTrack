import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

void main() {
  group('SubscriptionFormData varsayılan yenileme tarihi', () {
    test('başlangıç tarihi verildiğinde tek tarih kuralını kullanır', () {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day + 7);
      final data = SubscriptionFormData(startDate: start);

      expect(data.nextRenewalDate, start);
    });
  });

  group('SubscriptionForm validasyon', () {
    late GlobalKey<FormState> formKey;
    late SubscriptionFormData data;

    setUp(() {
      formKey = GlobalKey<FormState>();
      data = SubscriptionFormData();
    });

    Widget buildForm() => MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: SubscriptionForm(formKey: formKey, data: data),
            ),
          ),
        );

    testWidgets('boş ad ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Ad boş olamaz'), findsOneWidget);
    });

    testWidgets('boş tutar ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Tutar gir'), findsOneWidget);
    });

    testWidgets('sıfır tutar ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '0');
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Geçerli tutar gir'), findsOneWidget);
    });

    testWidgets('geçerli ad ve tutar ile form valid', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '49.90');
      final valid = formKey.currentState!.validate();
      await tester.pump();
      expect(valid, isTrue);
    });

    testWidgets('virgüllü tutar kabul edilir', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Spotify');
      await tester.enterText(find.byType(TextFormField).at(1), '29,99');
      final valid = formKey.currentState!.validate();
      await tester.pump();
      expect(valid, isTrue);
    });
  });

  group('S43 — abonelik bazlı hatırlatma kuralları', () {
    late GlobalKey<FormState> formKey;
    late SubscriptionFormData data;

    setUp(() {
      formKey = GlobalKey<FormState>();
      data = SubscriptionFormData();
    });

    Widget buildForm() => MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: SubscriptionForm(formKey: formKey, data: data),
            ),
          ),
        );

    // Form uzun (çok alanlı) — hatırlatma chip'leri varsayılan 800x600 test
    // yüzeyinde ekran dışında kalıyor; testler tap yerine kaydırma
    // gerektirmesin diye pump'tan önce yüzeyi büyütüyoruz.
    Future<void> pumpTallForm(WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(400, 2200));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(buildForm());
    }

    testWidgets('varsayılan olarak tek kural (3 gün) seçili', (tester) async {
      await pumpTallForm(tester);
      expect(data.notificationRules, [const NotificationRule(daysBefore: 3)]);
      final chip =
          tester.widget<FilterChip>(find.widgetWithText(FilterChip, '3 gün'));
      expect(chip.selected, isTrue);
    });

    testWidgets('başka bir seçenek seçilince öncekinin yerine geçer',
        (tester) async {
      await pumpTallForm(tester);

      await tester.tap(find.widgetWithText(FilterChip, '7 gün'));
      await tester.pump();

      expect(data.notificationRules, [const NotificationRule(daysBefore: 7)],
          reason: 'tekli seçim: yeni seçilen öncekinin yerine geçer');
    });

    testWidgets('seçili chip tekrar tıklanırsa seçili kalır', (tester) async {
      await pumpTallForm(tester);

      await tester.tap(find.widgetWithText(FilterChip, '3 gün'));
      await tester.pump();

      expect(data.notificationRules.length, 1,
          reason: 'tekli seçimde en az bir kural her zaman kalır');
    });
  });
}
