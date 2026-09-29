import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/settings/presentation/screens/appearance_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/feedback_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/notification_preferences_screen.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';

import '../../support/settings_scope.dart';

/// Çağrıları kaydeden ve izin sonucu ayarlanabilen bildirim uygulaması.
class _RecordingScheduler extends NoopNotificationScheduler {
  bool permissionGranted = true;
  bool alreadyGranted = true;
  int requestCalls = 0;
  int cancelAllCalls = 0;
  int testCalls = 0;

  @override
  Future<bool> requestPermission() async {
    requestCalls++;
    return permissionGranted;
  }

  @override
  Future<bool> arePermissionsGranted() async => alreadyGranted;

  @override
  Future<void> cancelAll() async => cancelAllCalls++;

  @override
  Future<void> sendTestNotification() async => testCalls++;
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('NotificationPreferencesScreen', () {
    Future<(SettingsController, _RecordingScheduler)> pump(
      WidgetTester tester, {
      SettingsController? controller,
    }) async {
      await tester.binding.setSurfaceSize(const Size(400, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final settings = controller ?? SettingsController();
      final scheduler = _RecordingScheduler();
      await tester.pumpWidget(withSettings(
        MaterialApp(home: NotificationPreferencesScreen(controller: settings)),
        settings: settings,
        notifications: scheduler,
      ));
      return (settings, scheduler);
    }

    testWidgets('varsayılan seçenekler gösterilir', (tester) async {
      await pump(tester);
      expect(find.text('Yenileme bildirimleri'), findsOneWidget);
      expect(find.text('3 gün önce'), findsOneWidget);
      expect(find.text('09:00'), findsOneWidget);
    });

    testWidgets('bildirimler kapatılınca planlanmış bildirimler iptal edilir',
        (tester) async {
      final (settings, scheduler) = await pump(tester);
      await tester.tap(find.byType(SwitchListTile));
      await tester.pumpAndSettle();

      expect(scheduler.cancelAllCalls, 1);
      expect(settings.notificationsEnabled, isFalse);
      expect(find.text('Kaç gün önce hatırlatılsın?'), findsNothing);
    });

    testWidgets('açarken izin istenir; verilirse etkinleşir', (tester) async {
      final settings = SettingsController();
      await settings.setNotifications(false);
      final (_, scheduler) = await pump(tester, controller: settings);

      await tester.tap(find.byType(SwitchListTile));
      await tester.pumpAndSettle();

      expect(scheduler.requestCalls, 1);
      expect(settings.notificationsEnabled, isTrue);
    });

    testWidgets('izin reddedilirse uyarı gösterilir ve ayar değişmez',
        (tester) async {
      final settings = SettingsController();
      await settings.setNotifications(false);
      final (_, scheduler) = await pump(tester, controller: settings);
      scheduler.permissionGranted = false;

      await tester.tap(find.byType(SwitchListTile));
      await tester.pumpAndSettle();

      expect(find.text('Bildirim izni verilmedi. Ayarlardan açabilirsin.'),
          findsOneWidget);
      expect(settings.notificationsEnabled, isFalse);
    });

    testWidgets('gün seçimi kaydedilir', (tester) async {
      final (settings, _) = await pump(tester);
      await tester.tap(find.text('7 gün önce'));
      await tester.pumpAndSettle();
      expect(settings.daysBefore, 7);
    });

    testWidgets('test bildirimi: izin varsa gönderilir', (tester) async {
      final (_, scheduler) = await pump(tester);
      await tester.tap(find.text('Test bildirimi gönder'));
      await tester.pumpAndSettle();

      expect(scheduler.testCalls, 1);
      expect(find.text('Test bildirimi gönderildi.'), findsOneWidget);
    });

    testWidgets('test bildirimi: izin kapalıysa uyarı gösterilir',
        (tester) async {
      final (_, scheduler) = await pump(tester);
      scheduler.alreadyGranted = false;
      await tester.tap(find.text('Test bildirimi gönder'));
      await tester.pumpAndSettle();

      expect(scheduler.testCalls, 0);
      expect(find.textContaining('Önce cihaz ayarlarından izin ver'),
          findsOneWidget);
    });

    testWidgets('hatırlatma saati seçilir', (tester) async {
      final (settings, _) = await pump(tester);
      await tester.tap(find.text('Hatırlatma saati'));
      await tester.pumpAndSettle();
      expect(find.text('Hatırlatma saati'), findsWidgets);

      // Saat seçicide iptal: değer değişmez.
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(settings.reminderHour, 9);
    });
  });

  group('AppearanceScreen', () {
    Future<SettingsController> pump(WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(400, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final settings = SettingsController();
      await tester.pumpWidget(
        MaterialApp(home: AppearanceScreen(controller: settings)),
      );
      return settings;
    }

    testWidgets('mevcut para birimi işaretlenir ve değiştirilebilir',
        (tester) async {
      final settings = await pump(tester);
      expect(find.byIcon(Icons.check), findsOneWidget);

      await tester.tap(find.text('Euro (EUR)'));
      await tester.pumpAndSettle();
      expect(settings.currency, 'EUR');
      expect(find.byIcon(Icons.check), findsOneWidget);
    });

    testWidgets('saat dilimi seçici açılır ve seçim kaydedilir',
        (tester) async {
      final settings = await pump(tester);
      expect(find.text('Cihaz varsayılanı'), findsOneWidget);

      await tester.tap(find.text('Saat dilimi').last);
      await tester.pumpAndSettle();
      expect(find.text('Saat dilimi seç'), findsOneWidget);

      await tester.tap(find.text('Türkiye (UTC+3)'));
      await tester.pumpAndSettle();

      expect(settings.timezone, 'Europe/Istanbul');
      expect(find.text('Türkiye (UTC+3)'), findsOneWidget);
    });

    testWidgets('listede olmayan saat dilimi ham adıyla gösterilir',
        (tester) async {
      final settings = await pump(tester);
      await settings.setTimezone('Pacific/Auckland');
      await tester.pumpAndSettle();
      expect(find.text('Pacific/Auckland'), findsOneWidget);
    });
  });

  group('FeedbackScreen', () {
    testWidgets('mesaj yazılmadan paylaşım pasif; yazınca açılır',
        (tester) async {
      await tester.binding.setSurfaceSize(const Size(400, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(const MaterialApp(home: FeedbackScreen()));

      FilledButton share() => tester.widget<FilledButton>(
          find.widgetWithText(FilledButton, 'Paylaşım ekranını aç'));
      expect(share().onPressed, isNull);
      expect(find.text('Paylaşmak için mesaj yazmalısın.'), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'Karanlık tema çok iyi');
      await tester.pump();
      expect(share().onPressed, isNotNull);
      expect(find.textContaining('paylaşım içeriğine eklenir'), findsOneWidget);
    });

    testWidgets('tür seçilebilir; Supabase yokken destek kaydı düğmesi yok',
        (tester) async {
      await tester.binding.setSurfaceSize(const Size(400, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(const MaterialApp(home: FeedbackScreen()));

      await tester.tap(find.text('Özellik isteği').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Hata bildirimi').last);
      await tester.pumpAndSettle();
      expect(find.text('Hata bildirimi'), findsOneWidget);

      expect(find.text('Destek kaydı oluştur'), findsNothing);
    });
  });
}
