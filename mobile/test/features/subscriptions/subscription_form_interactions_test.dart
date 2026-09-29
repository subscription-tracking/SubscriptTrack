import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

/// Formu, tarih seçici ve ödeme yöntemi etkileşimlerini denemek için açar.
Future<({SubscriptionFormData data, InMemoryAppPreferences prefs})> _pump(
  WidgetTester tester, {
  SubscriptionFormData? data,
}) async {
  await tester.binding.setSurfaceSize(const Size(420, 2400));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  final formData = data ?? SubscriptionFormData();
  final prefs = InMemoryAppPreferences();
  await tester.pumpWidget(MaterialApp(
    home: Scaffold(
      body: SingleChildScrollView(
        child: SubscriptionForm(
          formKey: GlobalKey<FormState>(),
          data: formData,
          settings: prefs,
        ),
      ),
    ),
  ));
  return (data: formData, prefs: prefs);
}

Future<void> _openDetails(WidgetTester tester) async {
  await tester.tap(find.text('Diğer ayrıntılar'));
  await tester.pumpAndSettle();
}

/// Açık tarih seçicide [day] gününü seçip onaylar.
Future<void> _pickDay(WidgetTester tester, int day) async {
  await tester.tap(find.text('$day').last);
  await tester.tap(find.text('OK'));
  await tester.pumpAndSettle();
}

void main() {
  group('tarih seçiciler', () {
    testWidgets('sonraki ödeme tarihi seçilir', (tester) async {
      final s = await _pump(tester);
      final target = DateTime.now().add(const Duration(days: 40));

      await tester.tap(find.text('Sonraki ödeme'));
      await tester.pumpAndSettle();
      // Takvimi seçilecek ayın olduğu görünüme getir ve günü seç.
      final months = (target.year - DateTime.now().year) * 12 +
          target.month -
          DateTime.now().month;
      for (var i = 0; i < months; i++) {
        await tester.tap(find.byTooltip('Next month'));
        await tester.pumpAndSettle();
      }
      await _pickDay(tester, target.day);

      expect(s.data.nextRenewalDate.year, target.year);
      expect(s.data.nextRenewalDate.month, target.month);
      expect(s.data.nextRenewalDate.day, target.day);
    });

    testWidgets('seçici iptal edilirse tarih değişmez', (tester) async {
      final s = await _pump(tester);
      final before = s.data.nextRenewalDate;
      await tester.tap(find.text('Sonraki ödeme'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(s.data.nextRenewalDate, before);
    });

    testWidgets(
        'başlangıç tarihi değişince sonraki yenileme yeniden hesaplanır',
        (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);
      await tester.tap(find.text('Başlangıç tarihi'));
      await tester.pumpAndSettle();
      await _pickDay(tester, 1);

      expect(s.data.startDate.day, 1);
      expect(s.data.nextRenewalDate.isBefore(s.data.startDate), isFalse);
    });

    testWidgets('deneme açılınca bitiş tarihi seçilir', (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);
      await tester.tap(find.byType(SwitchListTile));
      await tester.pumpAndSettle();
      expect(s.data.isTrial, isTrue);

      await tester.tap(find.text('Deneme bitiş tarihi'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();
      expect(s.data.trialEndDate, isNotNull);
    });
  });

  group('ödeme yöntemi', () {
    testWidgets('listeden yöntem seçilir', (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);

      await tester.tap(find.byType(DropdownButtonFormField<String?>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Papara').last);
      await tester.pumpAndSettle();
      expect(s.data.paymentMethod, 'Papara');
    });

    testWidgets('"Yeni yöntem ekle" diyaloğu yöntemi ekler ve seçer',
        (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);

      await tester.tap(find.byType(DropdownButtonFormField<String?>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('+ Yeni yöntem ekle'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme yöntemi ekle'), findsOneWidget);

      await tester.enterText(find.byType(TextField).last, 'Garanti Bonus');
      await tester.tap(find.text('Ekle'));
      await tester.pumpAndSettle();

      expect(s.data.paymentMethod, 'Garanti Bonus');
      expect(s.prefs.paymentMethods, contains('Garanti Bonus'));
    });

    testWidgets('boş ad veya İptal yöntemi eklemez', (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);
      await tester.tap(find.byType(DropdownButtonFormField<String?>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('+ Yeni yöntem ekle'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Ekle'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme yöntemi ekle'), findsOneWidget,
          reason: 'boş adla diyalog kapanmaz');

      await tester.tap(find.text('İptal'));
      await tester.pumpAndSettle();
      expect(s.prefs.paymentMethods, defaultPaymentMethods);
      expect(s.data.paymentMethod, isNull);
    });
  });

  group('diğer alanlar', () {
    testWidgets('para birimi ve döngü seçilir', (tester) async {
      final s = await _pump(tester);

      await tester.tap(find.byType(DropdownButtonFormField<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('€ EUR').last);
      await tester.pumpAndSettle();
      expect(s.data.currency, 'EUR');

      await tester.tap(find.byType(DropdownButtonFormField<BillingCycle>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yıllık').last);
      await tester.pumpAndSettle();
      expect(s.data.billingCycle, BillingCycle.yearly);
    });

    testWidgets('kategori ve ilk ödeme durumu seçilir', (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);

      await tester
          .tap(find.byType(DropdownButtonFormField<SubscriptionCategory>));
      await tester.pumpAndSettle();
      await tester.tap(find.text(SubscriptionCategory.music.label).last);
      await tester.pumpAndSettle();
      expect(s.data.category, SubscriptionCategory.music);

      await tester
          .tap(find.byType(DropdownButtonFormField<InitialPaymentStatus>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ödendi').last);
      await tester.pumpAndSettle();
      expect(s.data.initialPaymentStatus, InitialPaymentStatus.paid);
    });

    testWidgets('not alanı veriye yazılır', (tester) async {
      final s = await _pump(tester);
      await _openDetails(tester);
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Notlar (isteğe bağlı)'),
          'aile paketi');
      expect(s.data.notes, 'aile paketi');
    });
  });
}
