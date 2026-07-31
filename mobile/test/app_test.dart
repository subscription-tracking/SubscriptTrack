import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/app/app.dart';

void main() {
  testWidgets('Sprint 0 app shell renders and navigates', (tester) async {
    await tester.pumpWidget(const SubscriptTrackApp());

    expect(find.text('Tekrar hoş geldin 👋'), findsOneWidget);
    expect(find.text('Ana Sayfa'), findsWidgets);

    await tester.tap(find.text('Takvim').last);
    await tester.pumpAndSettle();
    expect(find.text('Yenileme ve deneme sürelerini takvim üzerinde takip et.'), findsOneWidget);
  });
}
