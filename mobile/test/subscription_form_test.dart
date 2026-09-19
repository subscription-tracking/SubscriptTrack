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

    testWidgets('varsayılan olarak tek kural (3 gün önce) seçili',
        (tester) async {
      await pumpTallForm(tester);
      expect(data.notificationRules, [const NotificationRule(daysBefore: 3)]);
      final chip = tester
          .widget<FilterChip>(find.widgetWithText(FilterChip, '3 gün önce'));
      expect(chip.selected, isTrue);
    });

    testWidgets('birden fazla hazır seçenek aynı anda seçilebilir',
        (tester) async {
      await pumpTallForm(tester);

      await tester.tap(find.widgetWithText(FilterChip, '7 gün önce'));
      await tester.pump();
      await tester.tap(find.widgetWithText(FilterChip, 'Bugün'));
      await tester.pump();

      final days = data.notificationRules.map((r) => r.daysBefore).toSet();
      expect(days, {3, 7, 0}, reason: 'varsayılan (3) korunur, 7 ve 0 eklenir');
    });

    testWidgets('son kalan kural kaldırılamaz', (tester) async {
      await pumpTallForm(tester);

      await tester.tap(find.widgetWithText(FilterChip, '3 gün önce'));
      await tester.pump();

      expect(data.notificationRules.length, 1,
          reason: 'tek kalan kural seçimi kaldırılamamalı');
    });

    testWidgets(
        'Özel ile 0-30 dışı bir değer reddedilir, geçerli değer eklenir',
        (tester) async {
      await pumpTallForm(tester);

      await tester.tap(find.widgetWithText(ActionChip, 'Özel'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.descendant(
            of: find.byType(AlertDialog), matching: find.byType(TextField)),
        '14',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Ekle'));
      await tester.pumpAndSettle();

      expect(
        data.notificationRules.any((r) => r.daysBefore == 14),
        isTrue,
        reason: 'özel gün eklendi',
      );
      expect(find.widgetWithText(FilterChip, '14 gün önce'), findsOneWidget,
          reason: 'yeni eklenen özel gün de bir chip olarak görünür');
    });

    testWidgets(
        'mevcut abonelikten gelen özel bir gün (ör. 14) forma girince chip olarak görünür',
        (tester) async {
      data = SubscriptionFormData(
        notificationRules: const [NotificationRule(daysBefore: 14)],
      );
      formKey = GlobalKey<FormState>();
      await pumpTallForm(tester);

      final chip = tester
          .widget<FilterChip>(find.widgetWithText(FilterChip, '14 gün önce'));
      expect(chip.selected, isTrue,
          reason: 'düzenleme akışında özel gün kaybolmamalı (round-trip)');
    });
  });
}
