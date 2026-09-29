import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../support/routed_app.dart';
import 'package:subscript_track/app/shell/app_shell.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/calendar/presentation/screens/calendar_screen.dart';
import 'package:subscript_track/features/notifications/presentation/notification_controller.dart';
import 'package:subscript_track/features/stats/presentation/screens/stats_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

void main() {
  testWidgets('authenticated shell renders dashboard and navigates',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    // Sağlayıcılar router'ın ÜSTÜNDE değil, rota ağacının atası olarak verilir:
    // üretimde `AuthenticatedShell` (ShellRoute) controller'ları alt rotalara
    // böyle sağlar. Alt ekranlar controller'ı ctor yerine ancak rota içinden
    // `context.read` ile okuyabildiği için, eksik sağlayıcı burada yakalanır.
    await tester.pumpWidget(
      routedApp(
        home: const AppShell(),
        providers: [
          ChangeNotifierProvider(
              create: (_) => SubscriptionController(userId: 'test-user')),
          ChangeNotifierProvider(create: (_) => NotificationController()),
          ChangeNotifierProvider(create: (_) => AuthController()),
        ],
      ),
    );

    expect(find.text('Merhaba'), findsOneWidget);
    expect(find.text('Ana Sayfa'), findsWidgets);

    // Takvim artık üst çubukta bildirim zilinin yanında bir simge.
    await tester.tap(find.byTooltip('Takvim'));
    await tester.pumpAndSettle();
    expect(find.byType(CalendarScreen), findsOneWidget);
    Navigator.of(tester.element(find.byType(CalendarScreen))).pop();
    await tester.pumpAndSettle();

    // Bildirim zili de aynı şekilde push edilir — aynı hatanın orada da
    // olmadığını doğruluyoruz.
    await tester.tap(find.byIcon(Icons.notifications_outlined));
    await tester.pumpAndSettle();
    expect(find.text('Bildirimler'), findsOneWidget);
    Navigator.of(tester.element(find.text('Bildirimler'))).pop();
    await tester.pumpAndSettle();

    // Navbar 4. sekme artık "İstatistikler".
    await tester.tap(find.bySemanticsLabel('İstatistikler'));
    await tester.pumpAndSettle();
    expect(find.byType(StatsScreen), findsOneWidget);

    await tester.binding.setSurfaceSize(null);
  });
}
