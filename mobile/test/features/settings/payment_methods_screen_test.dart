import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/features/settings/presentation/screens/payment_methods_screen.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';

Future<SettingsController> _pump(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  final controller = SettingsController();
  await tester.pumpWidget(
    MaterialApp(home: PaymentMethodsScreen(controller: controller)),
  );
  return controller;
}

void main() {
  testWidgets('varsayılan yöntemleri listeler', (tester) async {
    await _pump(tester);
    for (final name in defaultPaymentMethods) {
      expect(find.text(name), findsOneWidget);
    }
  });

  testWidgets('yeni yöntem eklenir; boş ad kabul edilmez', (tester) async {
    final controller = await _pump(tester);

    await tester.tap(find.text('Yeni ödeme yöntemi'));
    await tester.pumpAndSettle();
    expect(find.text('Yeni ödeme yöntemi ekle'), findsOneWidget);

    // Boş adla "Ekle" diyaloğu kapatmaz.
    await tester.tap(find.text('Ekle'));
    await tester.pumpAndSettle();
    expect(find.text('Yeni ödeme yöntemi ekle'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Garanti Bonus');
    await tester.tap(find.text('Ekle'));
    await tester.pumpAndSettle();

    expect(find.text('Yeni ödeme yöntemi ekle'), findsNothing);
    expect(controller.paymentMethods, contains('Garanti Bonus'));
    expect(find.text('Garanti Bonus'), findsOneWidget);
  });

  testWidgets('ekleme diyaloğu İptal ile hiçbir şey eklemeden kapanır',
      (tester) async {
    final controller = await _pump(tester);
    await tester.tap(find.text('Yeni ödeme yöntemi'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Vazgeçildi');
    await tester.tap(find.text('İptal'));
    await tester.pumpAndSettle();

    expect(controller.paymentMethods, isNot(contains('Vazgeçildi')));
  });

  testWidgets('yöntem yeniden adlandırılır', (tester) async {
    final controller = await _pump(tester);

    await tester.tap(find.byTooltip('Papara düzenle'));
    await tester.pumpAndSettle();
    expect(find.text('Ödeme yöntemini düzenle'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Nakit');
    await tester.tap(find.text('Kaydet'));
    await tester.pumpAndSettle();

    expect(controller.paymentMethods, contains('Nakit'));
    expect(controller.paymentMethods, isNot(contains('Papara')));
  });

  testWidgets('silme onay ister ve onaylanınca kaldırır', (tester) async {
    final controller = await _pump(tester);

    await tester.tap(find.byTooltip('Papara sil'));
    await tester.pumpAndSettle();
    expect(find.textContaining('silmek istediğine emin misin'), findsOneWidget);

    await tester.tap(find.text('İptal'));
    await tester.pumpAndSettle();
    expect(controller.paymentMethods, contains('Papara'));

    await tester.tap(find.byTooltip('Papara sil'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sil'));
    await tester.pumpAndSettle();
    expect(controller.paymentMethods, isNot(contains('Papara')));
  });

  testWidgets('tüm yöntemler silinince boş durum gösterilir ve eklenebilir',
      (tester) async {
    final controller = await _pump(tester);
    for (final name in [...defaultPaymentMethods]) {
      await controller.removePaymentMethod(name);
    }
    await tester.pumpAndSettle();

    expect(find.text('Henüz bir ödeme yöntemi eklemedin.'), findsOneWidget);
    await tester.tap(find.text('Ödeme yöntemi ekle'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Yeni');
    await tester.tap(find.text('Ekle'));
    await tester.pumpAndSettle();
    expect(controller.paymentMethods, ['Yeni']);
  });
}
