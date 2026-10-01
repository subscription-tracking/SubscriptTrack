import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/services/app_lock_gate.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';

void main() {
  testWidgets('5 hatadan sonra PIN alanı ve buton devre dışı, süre gösterilir',
      (tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    final service = AppLockService();
    await service.setPin('1234');
    service.lock();

    await tester.pumpWidget(MaterialApp(
      home: AppLockGate(service: service, child: const Text('içerik')),
    ));
    await tester.pump();

    for (var i = 0; i < 5; i++) {
      await tester.enterText(find.byType(TextField), '0000');
      await tester.tap(find.text('Kilidi aç'));
      await tester.pump();
      await tester.pump();
    }

    expect(find.textContaining('sonra tekrar dene'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
        isNull);
    expect(tester.widget<TextField>(find.byType(TextField)).enabled, isFalse);

    // Zamanlayıcıyı temizle.
    await tester.pumpWidget(const SizedBox());
  });
}
