import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('varsayılan değerler', () {
    final c = SettingsController();
    expect(c.currency, 'TRY');
    expect(c.notificationsEnabled, isTrue);
    expect(c.daysBefore, 3);
    expect(c.reminderHour, 9);
    expect(c.timezone, '');
    expect(c.paymentMethods, defaultPaymentMethods);
    expect(c.paymentMethodsSyncError, isNull);
  });

  test('load() kayıtlı tercihleri okur ve eski tema anahtarını siler',
      () async {
    SharedPreferences.setMockInitialValues({
      'settings_currency': 'USD',
      'settings_notifications': false,
      'settings_days_before': 7,
      'settings_reminder_hour': 18,
      'settings_timezone': 'Europe/Istanbul',
      'settings_payment_methods': ['Nakit'],
      'settings_theme': 1,
    });
    final c = SettingsController();
    var notified = 0;
    c.addListener(() => notified++);

    await c.load();

    expect(c.currency, 'USD');
    expect(c.notificationsEnabled, isFalse);
    expect(c.daysBefore, 7);
    expect(c.reminderHour, 18);
    expect(c.timezone, 'Europe/Istanbul');
    expect(c.paymentMethods, ['Nakit']);
    expect(notified, 1);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.containsKey('settings_theme'), isFalse);
  });

  test('load() aralık dışı saati 9\'a, bilinmeyen para birimini TRY\'ye çeker',
      () async {
    SharedPreferences.setMockInitialValues({
      'settings_reminder_hour': 42,
      'settings_currency': 'JPY',
    });
    final c = SettingsController();
    await c.load();
    expect(c.reminderHour, 9);
    expect(c.currency, 'TRY');
  });

  group('para birimi', () {
    test('sembol ve ISO kodu normalize edilir, ham değer saklanır', () async {
      final c = SettingsController();
      await c.setCurrency('€');
      expect(c.currency, 'EUR');
      await c.setCurrency(r'$');
      expect(c.currency, 'USD');
      await c.setCurrency('£');
      expect(c.currency, 'GBP');
      await c.setCurrency('₺');
      expect(c.currency, 'TRY');
      await c.setCurrency('XYZ');
      expect(c.currency, 'TRY');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('settings_currency'), 'XYZ');
    });
  });

  group('bildirim ve zaman ayarları', () {
    test('değişiklikler kalıcıdır ve dinleyicileri bilgilendirir', () async {
      final c = SettingsController();
      var notified = 0;
      c.addListener(() => notified++);

      await c.setNotifications(false);
      await c.setDaysBefore(5);
      await c.setReminderHour(20);
      await c.setTimezone('Europe/London');

      expect(c.notificationsEnabled, isFalse);
      expect(c.daysBefore, 5);
      expect(c.reminderHour, 20);
      expect(c.timezone, 'Europe/London');
      expect(notified, 4);

      final reloaded = SettingsController();
      await reloaded.load();
      expect(reloaded.notificationsEnabled, isFalse);
      expect(reloaded.daysBefore, 5);
      expect(reloaded.reminderHour, 20);
      expect(reloaded.timezone, 'Europe/London');
    });

    test('geçersiz hatırlatma saati yok sayılır', () async {
      final c = SettingsController();
      var notified = 0;
      c.addListener(() => notified++);
      await c.setReminderHour(-1);
      await c.setReminderHour(24);
      expect(c.reminderHour, 9);
      expect(notified, 0);
    });
  });

  group('ödeme yöntemleri', () {
    test('ekleme: kırpar, boşu ve tekrarı reddeder', () async {
      final c = SettingsController();
      await c.addPaymentMethod('  Garanti Bonus ');
      await c.addPaymentMethod('   ');
      await c.addPaymentMethod('Garanti Bonus');
      expect(c.paymentMethods, [...defaultPaymentMethods, 'Garanti Bonus']);
    });

    test('silme ve yeniden adlandırma', () async {
      final c = SettingsController();
      await c.removePaymentMethod('Papara');
      expect(c.paymentMethods, ['Kredi Kartı', 'Banka Kartı']);

      await c.renamePaymentMethod('Kredi Kartı', ' Akbank ');
      expect(c.paymentMethods, ['Akbank', 'Banka Kartı']);

      await c.renamePaymentMethod('Olmayan', 'X');
      await c.renamePaymentMethod('Akbank', '  ');
      expect(c.paymentMethods, ['Akbank', 'Banka Kartı']);
    });

    test('değişiklikler yeniden yüklemede korunur', () async {
      final c = SettingsController();
      await c.addPaymentMethod('Nakit');
      final reloaded = SettingsController();
      await reloaded.load();
      expect(reloaded.paymentMethods, contains('Nakit'));
    });

    test('yeniden deneme uzak senkron olmadan da bildirim gönderir', () async {
      final c = SettingsController();
      var notified = 0;
      c.addListener(() => notified++);
      await c.retryPaymentMethodsSync();
      expect(notified, 1);
      expect(c.paymentMethodsSyncError, isNull);
    });

    test('hesap silinince yerel etiketler varsayılana döner', () async {
      final c = SettingsController();
      await c.addPaymentMethod('Nakit');
      await c.clearAccountPaymentMethods();
      expect(c.paymentMethods, defaultPaymentMethods);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.containsKey('settings_payment_methods'), isFalse);
    });

    test('paymentMethods değiştirilemez bir görünümdür', () {
      final c = SettingsController();
      expect(() => c.paymentMethods.add('x'), throwsUnsupportedError);
    });
  });

  group('InMemoryAppPreferences', () {
    test('varsayılan etiketlerle başlar, ekleme ve temizleme çalışır',
        () async {
      final p = InMemoryAppPreferences(currency: 'USD');
      expect(p.currency, 'USD');
      expect(p.paymentMethods, defaultPaymentMethods);
      await p.addPaymentMethod(' Nakit ');
      await p.addPaymentMethod('Nakit');
      await p.addPaymentMethod('');
      expect(p.paymentMethods.last, 'Nakit');
      expect(p.paymentMethods.length, defaultPaymentMethods.length + 1);
      await p.clearAccountPaymentMethods();
      expect(p.paymentMethods, defaultPaymentMethods);
    });
  });
}
