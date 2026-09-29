import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/storage/secure_supabase_storage.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/form/subscription_presets.dart';
import 'package:subscript_track/shared/widgets/app_bounceable.dart';
import 'package:subscript_track/shared/widgets/app_section_header.dart';
import 'package:subscript_track/shared/widgets/app_shimmer.dart';

// MaterialApp sayfa geçişleri de ScaleTransition kullanır; yalnızca
// AppBounceable'ınkini seçmek için kapsam daraltılır.
final _scaleFinder = find.descendant(
  of: find.byType(AppBounceable),
  matching: find.byType(ScaleTransition),
);

void main() {
  group('AppBounceable', () {
    testWidgets('dokunma geri çağrıyı tetikler ve basılıyken küçülür',
        (tester) async {
      var taps = 0;
      await tester.pumpWidget(MaterialApp(
        home: Center(
          child: AppBounceable(
            onTap: () => taps++,
            child: const SizedBox(width: 100, height: 50, child: Text('düğme')),
          ),
        ),
      ));

      final gesture =
          await tester.startGesture(tester.getCenter(find.text('düğme')));
      await tester.pump(const Duration(milliseconds: 150));
      // TapDown 100 ms sonra tetiklenir; animasyon bir sonraki karede ilerler.
      await tester.pump(const Duration(milliseconds: 100));
      final pressed = tester.widget<ScaleTransition>(_scaleFinder);
      expect(pressed.scale.value, lessThan(1.0));

      await gesture.up();
      await tester.pumpAndSettle();
      expect(taps, 1);
      expect(
        tester.widget<ScaleTransition>(_scaleFinder).scale.value,
        1.0,
      );
    });

    testWidgets(
        'sürükleyerek iptal edilirse ölçek geri döner, tıklama sayılmaz',
        (tester) async {
      var taps = 0;
      await tester.pumpWidget(MaterialApp(
        home: Center(
          child: AppBounceable(
            onTap: () => taps++,
            child: const SizedBox(width: 100, height: 50, child: Text('düğme')),
          ),
        ),
      ));
      final gesture =
          await tester.startGesture(tester.getCenter(find.text('düğme')));
      await tester.pump(const Duration(milliseconds: 150));
      // TapDown 100 ms sonra tetiklenir; animasyon bir sonraki karede ilerler.
      await tester.pump(const Duration(milliseconds: 100));
      await gesture.moveBy(const Offset(0, 300));
      await gesture.cancel();
      await tester.pumpAndSettle();
      expect(taps, 0);
      expect(
        tester.widget<ScaleTransition>(_scaleFinder).scale.value,
        1.0,
      );
    });

    testWidgets('onTap null ise animasyon başlamaz', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Center(
          child: AppBounceable(
            onTap: null,
            child: SizedBox(width: 100, height: 50, child: Text('pasif')),
          ),
        ),
      ));
      final gesture =
          await tester.startGesture(tester.getCenter(find.text('pasif')));
      await tester.pump(const Duration(milliseconds: 150));
      // TapDown 100 ms sonra tetiklenir; animasyon bir sonraki karede ilerler.
      await tester.pump(const Duration(milliseconds: 100));
      expect(
        tester.widget<ScaleTransition>(_scaleFinder).scale.value,
        1.0,
      );
      await gesture.up();
    });
  });

  group('AppSectionHeader', () {
    testWidgets('yalnızca başlık', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(body: AppSectionHeader(title: 'Başlık')),
      ));
      expect(find.text('Başlık'), findsOneWidget);
      expect(find.byType(TextButton), findsNothing);
    });

    testWidgets('eylem etiketi ve geri çağrı birlikte verilirse buton çıkar',
        (tester) async {
      var pressed = false;
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: AppSectionHeader(
            title: 'Yaklaşan',
            actionLabel: 'Tümü',
            onAction: () => pressed = true,
          ),
        ),
      ));
      await tester.tap(find.text('Tümü'));
      expect(pressed, isTrue);
    });

    testWidgets('etiket olup geri çağrı yoksa buton çıkmaz', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: AppSectionHeader(title: 'A', actionLabel: 'Tümü'),
        ),
      ));
      expect(find.text('Tümü'), findsNothing);
    });
  });

  testWidgets('AppShimmer boyutunu korur ve animasyon çalışır', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: AppShimmer(width: 120, height: 40, borderRadius: 8)),
    ));
    expect(tester.getSize(find.byType(AppShimmer)), const Size(120, 40));
    await tester.pump(const Duration(milliseconds: 700));
    expect(tester.getSize(find.byType(AppShimmer)), const Size(120, 40));
    // Animasyon sonsuz olduğundan widget kaldırılarak sonlandırılır.
    await tester.pumpWidget(const SizedBox());
  });

  group('SecureSupabaseStorage', () {
    setUp(() => FlutterSecureStorage.setMockInitialValues({}));
    const storage = SecureSupabaseStorage();

    test('oturum saklanır, okunur ve silinir', () async {
      await storage.initialize();
      expect(await storage.hasAccessToken(), isFalse);
      expect(await storage.accessToken(), isNull);

      await storage.persistSession('{"session":"x"}');
      expect(await storage.hasAccessToken(), isTrue);
      expect(await storage.accessToken(), '{"session":"x"}');

      await storage.removePersistedSession();
      expect(await storage.hasAccessToken(), isFalse);
    });
  });

  test('form öneri listesi geçerli ve tekrarsız', () {
    final names = popularSubscriptionPresets.map((p) => p.$1).toList();
    expect(names, isNotEmpty);
    expect(names.toSet(), hasLength(names.length), reason: 'ad tekrarı yok');
    expect(popularSubscriptionPresets.map((p) => p.$2),
        everyElement(isA<SubscriptionCategory>()));
    expect(names, containsAll(['Netflix', 'Spotify']));
  });
}
