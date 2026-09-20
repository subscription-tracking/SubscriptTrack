import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
    // Providers are nested INSIDE `home`, not above MaterialApp — this
    // mirrors production (AuthenticatedShell creates them as the content of
    // the '/home' GoRoute). A screen pushed via Navigator.push becomes a
    // sibling route in the Navigator's Overlay, not a descendant of `home`,
    // so any screen relying on ancestor Provider lookup instead of an
    // explicit constructor parameter would throw ProviderNotFoundException
    // here — catching the exact bug this test used to miss.
    await tester.pumpWidget(
      MaterialApp(
        home: MultiProvider(
          providers: [
            ChangeNotifierProvider(
                create: (_) => SubscriptionController(userId: 'test-user')),
            ChangeNotifierProvider(create: (_) => NotificationController()),
            ChangeNotifierProvider(create: (_) => AuthController()),
          ],
          child: const AppShell(),
        ),
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
