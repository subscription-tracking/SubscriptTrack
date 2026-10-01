import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/services/app_lock_gate.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';

/// Denetim F-17: ekran gizliliği yalnızca uygulama kilidi açıkken.
void main() {
  final calls = <bool>[];

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    calls.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('com.subscripttrack.app/privacy'),
            (call) async {
      expect(call.method, 'setSecure');
      calls.add((call.arguments as Map)['secure'] as bool);
      return null;
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('com.subscripttrack.app/privacy'), null);
  });

  Widget app(AppLockService s) => MaterialApp(
        home: AppLockGate(service: s, child: const Text('gizli içerik')),
      );

  testWidgets('kilit kapalıyken FLAG_SECURE kapalı, arka planda örtü yok',
      (tester) async {
    final service = AppLockService();
    await tester.pumpWidget(app(service));
    await tester.pump();

    expect(calls, [false]);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    await tester.pump();
    expect(find.byIcon(Icons.lock_outline), findsNothing);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
  });

  testWidgets('kilit açıkken FLAG_SECURE açılır, inactive olunca örtü çıkar',
      (tester) async {
    final service = AppLockService();
    await service.setPin('1234');
    await service.setLockTimeout(const Duration(minutes: 5));
    await tester.pumpWidget(app(service));
    await tester.pump();
    expect(await service.verifyPin('1234'), isTrue);
    await tester.pump();

    expect(calls.last, isTrue);

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    await tester.pump();
    expect(find.byIcon(Icons.lock_outline), findsOneWidget);
    expect(service.locked, isFalse, reason: 'süre dolmadan kilit açılmaz');

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    expect(find.byIcon(Icons.lock_outline), findsNothing);
  });

  testWidgets('kilit kapatılınca FLAG_SECURE tekrar kapanır', (tester) async {
    final service = AppLockService();
    await service.setPin('1234');
    await tester.pumpWidget(app(service));
    await tester.pump();
    expect(calls.last, isTrue);

    await service.disable();
    await tester.pump();
    expect(calls.last, isFalse);
  });
}
