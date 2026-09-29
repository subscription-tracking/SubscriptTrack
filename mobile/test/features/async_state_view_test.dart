import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/shared/widgets/app_offline_banner.dart';
import 'package:subscript_track/shared/widgets/async_state_view.dart';

Widget _host(Widget child) =>
    MaterialApp(home: Scaffold(body: SizedBox(height: 600, child: child)));

void main() {
  testWidgets('yükleniyor + veri yok → spinner', (tester) async {
    await tester.pumpWidget(_host(const AsyncStateView(
      loading: true,
      isEmpty: true,
      child: Text('içerik'),
    )));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('içerik'), findsNothing);
  });

  testWidgets('yükleniyor ama veri var → içerik', (tester) async {
    await tester.pumpWidget(_host(const AsyncStateView(
      loading: true,
      isEmpty: false,
      child: Text('içerik'),
    )));
    expect(find.text('içerik'), findsOneWidget);
  });

  testWidgets('hata → mesaj ve tekrar dene', (tester) async {
    var retried = false;
    await tester.pumpWidget(_host(AsyncStateView(
      isEmpty: true,
      error: 'Sunucu hatası',
      onRetry: () => retried = true,
      child: const Text('içerik'),
    )));
    expect(find.text('Sunucu hatası'), findsOneWidget);
    await tester.tap(find.text('Tekrar dene'));
    expect(retried, isTrue);
  });

  testWidgets('boş → empty widget', (tester) async {
    await tester.pumpWidget(_host(const AsyncStateView(
      isEmpty: true,
      empty: Text('boş'),
      child: Text('içerik'),
    )));
    expect(find.text('boş'), findsOneWidget);
  });

  testWidgets('offline → şerit içeriğin üstünde', (tester) async {
    await tester.pumpWidget(_host(AsyncStateView(
      isOffline: true,
      pendingCount: 2,
      isEmpty: false,
      onRetry: () {},
      child: const Text('içerik'),
    )));
    expect(find.byType(AppOfflineBanner), findsOneWidget);
    expect(find.text('içerik'), findsOneWidget);
  });
}
