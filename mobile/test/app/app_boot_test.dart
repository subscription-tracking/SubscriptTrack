import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/app/app.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/auth/presentation/screens/login_screen.dart';
import 'package:subscript_track/features/onboarding/presentation/screens/onboarding_screen.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('ilk açılışta tanıtım turu gösterilir', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const SubscriptTrackApp());
    // Tanıtım ekranı sonsuz animasyon içerir; pumpAndSettle kullanılamaz.
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(OnboardingScreen), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('tanıtım tamamlandıysa ve oturum yoksa giriş ekranı açılır',
      (tester) async {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});
    await tester.pumpWidget(const SubscriptTrackApp());
    await tester.pumpAndSettle();
    expect(find.byType(LoginScreen), findsOneWidget);
  });

  testWidgets('verilen bildirim uygulaması kabul edilir', (tester) async {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});
    await tester.pumpWidget(
        SubscriptTrackApp(notifications: NoopNotificationScheduler()));
    await tester.pumpAndSettle();
    expect(find.byType(MaterialApp), findsOneWidget);
    // Widget ağacı kaldırılırken controller'lar dispose edilir.
    await tester.pumpWidget(const SizedBox());
  });
}
