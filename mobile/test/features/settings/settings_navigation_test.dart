import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart' show ShareParams, ShareResult;
import 'package:share_plus_platform_interface/share_plus_platform_interface.dart'
    show SharePlatform;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/settings/presentation/screens/app_lock_settings_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/appearance_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/delete_account_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/export_data_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/feedback_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/notification_preferences_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/payment_methods_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/privacy_center_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/privacy_policy_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/profile_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/settings_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/terms_of_service_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../../support/fake_auth.dart';
import '../../support/fake_subscription_repo.dart';
import '../../support/routed_app.dart';

/// Paylaşım çağrılarını kaydeden sahte platform.
class _FakeShare extends SharePlatform {
  final shared = <ShareParams>[];

  @override
  Future<ShareResult> share(ShareParams params) async {
    shared.add(params);
    return ShareResult.unavailable;
  }
}

typedef _Scope = ({
  AuthController auth,
  FakeAuthDataSource source,
  SubscriptionController subs,
});

Future<_Scope> _scope() async {
  FlutterSecureStorage.setMockInitialValues({});
  final s = await signedInAuth(
      email: 'ayse.demir@example.com', displayName: 'Ayşe Demir');
  final subs = SubscriptionController(
    userId: 'u1',
    repository: FakeSubscriptionRepo([
      testSubscription('1', name: 'Netflix'),
      testSubscription('2',
          name: '=EVIL()', notes: '+cmd', paymentMethod: '@kart'),
    ]),
  );
  await subs.load();
  return (auth: s.auth, source: s.source, subs: subs);
}

Widget _app(Widget home, _Scope scope) => routedApp(
      home: home,
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: scope.auth),
        ChangeNotifierProvider<SubscriptionController>.value(value: scope.subs),
        ChangeNotifierProvider<AppLockService>(create: (_) => AppLockService()),
      ],
    );

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('ProfileTab (ayarlar sekmesi)', () {
    Future<void> pump(WidgetTester tester, _Scope scope) async {
      await tester.binding.setSurfaceSize(const Size(400, 1400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(_app(const Scaffold(body: ProfileTab()), scope));
      await tester.pump();
    }

    testWidgets('hesap özeti ve tercih değerleri gösterilir', (tester) async {
      final scope = await _scope();
      await pump(tester, scope);

      expect(find.text('Ayşe Demir'), findsOneWidget);
      expect(find.text('ayse.demir@example.com'), findsOneWidget);
      expect(find.text('AD'), findsOneWidget,
          reason: 'ad soyaddan baş harfler');
      expect(find.text('Açık'), findsOneWidget);
      expect(find.text('3 kayıtlı yöntem'), findsOneWidget);
      expect(find.text('v1.0.0'), findsOneWidget);
    });

    testWidgets('görünen ad yoksa e-postanın yerel kısmı kullanılır',
        (tester) async {
      final scope = await _scope();
      await scope.source.updateDisplayName('');
      await scope.auth.updateDisplayName('');
      await pump(tester, scope);
      expect(find.text('ayse.demir'), findsOneWidget);
    });

    testWidgets('avatar baş harfleri farklı ad ve e-posta biçimlerinde',
        (tester) async {
      Future<String> initialsFor(String? displayName, String email) async {
        final s = await signedInAuth(email: email, displayName: displayName);
        final subs = SubscriptionController(
            userId: 'u1', repository: FakeSubscriptionRepo());
        await tester.pumpWidget(_app(
          const Scaffold(body: ProfileTab()),
          (auth: s.auth, source: s.source, subs: subs),
        ));
        await tester.pump();
        final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
        return (avatar.child as Text).data!;
      }

      expect(await initialsFor(null, 'kisi@example.com'), 'KI');
      expect(await initialsFor('Z', 'kisi@example.com'), 'Z');
      expect(await initialsFor('Mehmet Ali Veli', 'x@y.z'), 'MA');
      expect(await initialsFor(null, 'a@example.com'), 'A');
    });

    testWidgets('kullanıcı yoksa boş görünüm', (tester) async {
      final scope = await _scope();
      await scope.auth.signOut();
      await pump(tester, scope);
      expect(find.text('Çıkış Yap'), findsNothing);
    });

    for (final (label, screen) in <(String, Type)>[
      ('Hesap bilgileri', ProfileScreen),
      ('Bildirim ayarları', NotificationPreferencesScreen),
      ('Ödeme yöntemi seçenekleri', PaymentMethodsScreen),
      ('Para birimi ve saat dilimi', AppearanceScreen),
      ('Uygulama kilidi', AppLockSettingsScreen),
      ('Gizlilik ve veri merkezi', PrivacyCenterScreen),
      ('Geri bildirim gönder', FeedbackScreen),
    ]) {
      testWidgets('"$label" doğru ekranı açar', (tester) async {
        final scope = await _scope();
        await pump(tester, scope);
        await tester.tap(find.text(label).first);
        await tester.pumpAndSettle();
        expect(find.byType(screen), findsOneWidget);
      });
    }

    testWidgets('tanıtım turunu yeniden başlatır', (tester) async {
      final scope = await _scope();
      await pump(tester, scope);
      await tester.tap(find.text('Tanıtım turunu yeniden başlat'));
      await tester.pump();
      expect((scope.auth).onboardingNeeded, isTrue);
    });

    testWidgets('çıkış: onay diyaloğu, iptalde oturum korunur', (tester) async {
      final scope = await _scope();
      await pump(tester, scope);

      await tester.tap(find.text('Çıkış Yap'));
      await tester.pumpAndSettle();
      expect(find.text('Hesabından çıkmak istiyor musun?'), findsOneWidget);

      await tester.tap(find.text('İptal'));
      await tester.pumpAndSettle();
      expect((scope.auth).user, isNotNull);
    });

    testWidgets('çıkış: onaylanınca oturum kapanır', (tester) async {
      final scope = await _scope();
      await pump(tester, scope);

      await tester.tap(find.text('Çıkış Yap'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Çıkış yap').last);
      await tester.pumpAndSettle();

      expect((scope.auth).user, isNull);
      expect((scope.source).signOutCalls, 1);
    });
  });

  group('PrivacyCenterScreen', () {
    Future<void> pump(WidgetTester tester, _Scope scope) async {
      await tester.binding.setSurfaceSize(const Size(400, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(_app(
        PrivacyCenterScreen(
          auth: scope.auth,
          subscriptions: scope.subs,
        ),
        scope,
      ));
    }

    for (final (label, screen) in <(String, Type)>[
      ('Gizlilik Politikası', PrivacyPolicyScreen),
      ('Kullanım Şartları', TermsOfServiceScreen),
      ('Verilerimi dışa aktar', ExportDataScreen),
      ('Hesabımı ve verilerimi sil', DeleteAccountScreen),
    ]) {
      testWidgets('"$label" doğru ekranı açar', (tester) async {
        final scope = await _scope();
        await pump(tester, scope);
        await tester.tap(find.textContaining(label));
        await tester.pumpAndSettle();
        expect(find.byType(screen), findsOneWidget);
      });
    }
  });

  group('ExportDataScreen', () {
    final clipboard = <String>[];

    setUp(() {
      clipboard.clear();
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') {
          clipboard.add((call.arguments as Map)['text'] as String);
        }
        return null;
      });
      addTearDown(() => TestDefaultBinaryMessengerBinding
          .instance.defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, null));
    });

    Future<SubscriptionController> pump(
      WidgetTester tester, {
      bool empty = false,
    }) async {
      final subs = SubscriptionController(
        userId: 'u1',
        repository: FakeSubscriptionRepo(empty
            ? []
            : [
                testSubscription('1', name: 'Netflix'),
                testSubscription('2',
                    name: '=EVIL()', notes: '+cmd', paymentMethod: '@kart'),
                testSubscription('3',
                    name: 'Eski', status: SubscriptionStatus.archived),
              ]),
      );
      await subs.load();
      await tester
          .pumpWidget(MaterialApp(home: ExportDataScreen(subscriptions: subs)));
      await tester.pump();
      return subs;
    }

    testWidgets('abonelik sayısı gösterilir (arşiv hariç)', (tester) async {
      await pump(tester);
      expect(find.textContaining('2 abonelik'), findsOneWidget);
    });

    testWidgets('abonelik yokken dışa aktarma düğmeleri pasif', (tester) async {
      await pump(tester, empty: true);
      for (final label in [
        'Dosya olarak paylaş',
        'Güvenli biçimde dışa aktar',
        'Panoya kopyala'
      ]) {
        final button = tester.widget<ButtonStyleButton>(
          find.ancestor(
              of: find.text(label),
              matching: find.byWidgetPredicate((w) => w is ButtonStyleButton)),
        );
        expect(button.onPressed, isNull, reason: label);
      }
    });

    testWidgets('panoya kopyalanan CSV formülleri etkisizleştirir',
        (tester) async {
      await pump(tester);
      await tester.tap(find.text('Panoya kopyala'));
      await tester.pumpAndSettle();

      expect(find.text('CSV panoya kopyalandı.'), findsOneWidget);
      final csv = clipboard.single;
      expect(csv, contains('"name","amount"'));
      expect(csv, contains('"Netflix"'));
      expect(csv, contains('"\'=EVIL()"'));
      expect(csv, contains('"\'+cmd"'));
      expect(csv, contains('"\'@kart"'));
      expect(csv, isNot(contains('"Eski"')), reason: 'arşiv dışa aktarılmaz');
    });

    testWidgets('bulut dışa aktarma kullanılamazsa kullanıcıya bildirilir',
        (tester) async {
      await pump(tester);
      await tester.tap(find.text('Güvenli biçimde dışa aktar'));
      await tester.pumpAndSettle();
      expect(find.textContaining('kullanılamıyor'), findsOneWidget);
    });

    testWidgets('dosya olarak paylaş CSV metnini paylaşım katmanına iletir',
        (tester) async {
      final share = _FakeShare();
      SharePlatform.instance = share;

      await pump(tester);
      await tester.tap(find.text('Dosya olarak paylaş'));
      await tester.pumpAndSettle();

      expect(share.shared, hasLength(1));
      expect(share.shared.single.text, contains('Netflix'));
      expect(share.shared.single.subject, 'SubscriptTrack Abonelik Verisi');
    });
  });
}
