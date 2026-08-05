import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:subscript_track/app/shell/app_shell.dart';
import 'package:subscript_track/features/calendar/presentation/screens/calendar_screen.dart';
import 'package:subscript_track/features/notifications/presentation/notification_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

void main() {
  testWidgets('authenticated shell renders dashboard and navigates', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => SubscriptionController(userId: 'test-user')),
          ChangeNotifierProvider(create: (_) => NotificationController()),
        ],
        child: const MaterialApp(home: AppShell()),
      ),
    );

    expect(find.text('Merhaba 👋'), findsOneWidget);
    expect(find.text('Ana Sayfa'), findsWidgets);

    await tester.tap(find.bySemanticsLabel('Takvim'));
    await tester.pumpAndSettle();
    expect(find.byType(CalendarScreen), findsOneWidget);
    await tester.binding.setSurfaceSize(null);
  });
}
