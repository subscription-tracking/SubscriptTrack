import 'package:flutter/foundation.dart' show kIsWeb, visibleForTesting;
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../../features/notifications/domain/notification_rule.dart';
import '../../features/subscriptions/domain/subscription_models.dart';
import '../errors/error_messages.dart';
import 'notification_platform.dart';
import 'notification_scheduler.dart';
import 'reminder_planner.dart';

/// Yerel bildirim planlama servisi. Platform çağrıları [NotificationPlatform]
/// arkasındadır; planlama kuralları [ReminderPlanner]'dadır.
class LocalNotificationService implements NotificationScheduler {
  LocalNotificationService({NotificationPlatform? platform})
      : _platform = platform ?? FlutterNotificationPlatform();

  final NotificationPlatform _platform;
  bool _initialized = false;

  static const snoozeDuration = Duration(minutes: 30);
  static const _maxNotificationId = 2147483647;

  /// Son planlamanın parmak izi — gereksiz iptal+yeniden planlamayı önler.
  int? _lastScheduleHash;
  String? _deviceTimezone;

  /// iOS, aynı anda en fazla 64 bekleyen yerel bildirime izin verir (bunun
  /// üzerinde OS sessizce eski/rastgele bildirimleri düşürür). Android'de
  /// resmi bir sabit sayı yoktur ama çok sayıda "exact alarm" pil/performans
  /// sorunu yaratır. Bu yüzden platformdan bağımsız GÜVENLİ bir üst sınır
  /// uyguluyoruz (Test 57).
  static const maxScheduledNotifications = ReminderPlanner.defaultLimit;

  /// Bildirime dokunulunca (payload = abonelik id'si) tetiklenir.
  /// AuthenticatedShell bunu dinleyip ilgili detay ekranına yönlendirir (Test 35).
  @override
  void Function(String subscriptionId)? onNotificationTap;

  /// Bildirimdeki "Ertele" aksiyonuna basılınca (payload = abonelik id'si)
  /// tetiklenir. AuthenticatedShell bunu dinleyip [snooze]'u çağırır (Test 36).
  @override
  void Function(String subscriptionId)? onSnoozeRequested;

  bool get _unavailable => kIsWeb || !_initialized;

  @override
  Future<void> initialize() async {
    if (_initialized) return;
    tz.initializeTimeZones();
    await refreshDeviceLocalTimezone();
    await _platform.initialize(onResponse: _dispatchNotificationResponse);
    _initialized = true;
  }

  void _dispatchNotificationResponse(String? payload, String? actionId) {
    final subscriptionId = payload;
    if (subscriptionId == null || subscriptionId.isEmpty) return;
    if (actionId == FlutterNotificationPlatform.snoozeActionId) {
      onSnoozeRequested?.call(subscriptionId);
    } else {
      onNotificationTap?.call(subscriptionId);
    }
  }

  @visibleForTesting
  void dispatchNotificationResponseForTesting({
    String? payload,
    String? actionId,
  }) =>
      _dispatchNotificationResponse(payload, actionId);

  /// Uygulama SIFIRDAN (cold start) bir bildirime dokunularak açıldıysa,
  /// ilgili aboneliğin id'sini döner — aksi halde null. AuthenticatedShell
  /// ilk frame sonrası bunu kontrol edip yönlendirme yapar (Test 35).
  @override
  Future<String?> getLaunchNotificationSubscriptionId() async {
    if (_unavailable) return null;
    return _platform.launchPayload();
  }

  /// Bildirim izninin şu an fiilen açık olup olmadığını (kullanıcıya SORMADAN)
  /// kontrol eder. Abonelik eklerken proaktif uyarı göstermek için kullanılır
  /// (Test 37) — [requestPermission] gibi bir izin isteği DİYALOĞU açmaz.
  @override
  Future<bool> arePermissionsGranted() async {
    if (_unavailable) return true;
    return _platform.areNotificationsEnabled();
  }

  /// `tz.local`, `tz.setLocalLocation()` çağrılmadığı sürece paketin kendi
  /// varsayılanı olan UTC'de kalır — cihazın gerçek saat dilimini YANSITMAZ.
  /// Bu çağrı olmadan "09:00'da hatırlat" gibi zamanlanmış bildirimler,
  /// UTC'den farklı bir dilimdeki (ör. Türkiye, UTC+3) kullanıcılar için
  /// saatlerce kaymış olarak tetiklenir (Test 41).
  /// Cihazın IANA saat dilimini yeniden okur. Değiştiyse eski planlama
  /// parmak izi geçersiz sayılır; bir sonraki schedule çağrısı bildirimleri
  /// yeni yerel saat için yeniden kurar.
  @override
  Future<bool> refreshDeviceLocalTimezone() async {
    if (kIsWeb) return false;
    try {
      final deviceTimezone =
          (await FlutterTimezone.getLocalTimezone()).identifier;
      if (deviceTimezone == _deviceTimezone) return false;
      tz.setLocalLocation(tz.getLocation(deviceTimezone));
      _deviceTimezone = deviceTimezone;
      _lastScheduleHash = null;
      return true;
    } catch (e) {
      // Cihaz saat dilimi okunamazsa UTC'de kalınır (mevcut güvenli varsayılan).
      logIgnoredError('LocalNotificationService.timezone', e);
      return false;
    }
  }

  @override
  Future<bool> requestPermission() async {
    if (kIsWeb) return false;
    return _platform.requestPermission();
  }

  /// [timezone] boş string ise cihaz yerel saat dilimi kullanılır.
  /// [reminderHour] 0-23 arası, hatırlatmaların planlandığı yerel saat
  /// (varsayılan 09:00) — kullanıcı ayarlardan özelleştirebilir (Test 31).
  @override
  Future<void> scheduleRenewalReminders(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int reminderHour = 9,
  }) async {
    if (_unavailable) return;
    final hour = reminderHour >= 0 && reminderHour <= 23 ? reminderHour : 9;
    // Aynı girdiyle tekrar planlama yapılmaz.
    final hash = scheduleFingerprint(
      subscriptions,
      daysBefore,
      timezone: timezone,
      trials: trials,
      rules: rules,
      reminderHour: hour,
    );
    if (hash == _lastScheduleHash) return;
    _lastScheduleHash = hash;

    // Android 12+ tam zamanlı alarm izni yoksa yaklaşık zamana düşülür.
    final exact = await _platform.canScheduleExact();
    await _platform.cancelAll();
    final location = timezone.isNotEmpty ? tz.getLocation(timezone) : tz.local;
    final reminders = ReminderPlanner.plan(
      subscriptions: subscriptions,
      trials: trials,
      daysBefore: daysBefore,
      rules: rules,
      hour: hour,
      location: location,
      now: tz.TZDateTime.now(location),
      limit: maxScheduledNotifications,
    );

    for (final reminder in reminders) {
      await _platform.schedule(ScheduledNotification(
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        when: reminder.scheduled,
        channelDescription: reminder.channelDescription,
        // Test 35: bildirime dokununca hangi aboneliğe gidileceğini taşır.
        payload: reminder.payload,
        exact: exact,
      ));
    }
  }

  /// Bildirimin içeriğini veya zamanını etkileyen bir alan değiştiğinde yeni
  /// bir planlama yapılmasını sağlar. Platform çağrısı olmadan test edilebilir.
  @visibleForTesting
  static int scheduleFingerprint(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int reminderHour = 9,
  }) =>
      ReminderPlanner.fingerprint(
        subscriptions,
        daysBefore,
        timezone: timezone,
        trials: trials,
        rules: rules,
        reminderHour: reminderHour,
      );

  /// Bildirimdeki "Ertele" aksiyonuna basılınca çağrılır (Test 36):
  /// [sub] için [snoozeDuration] sonra tek seferlik bir hatırlatma bildirimi
  /// tekrar gösterilir. Orijinal id ile aynı `stableNotifId` kullanılmıyor —
  /// bu kasıtlı olarak YENİ bir bildirim, orijinal zamanlanmış hatırlatmanın
  /// yerini almaz (o da mevcut kalır).
  @override
  Future<void> snooze(Subscription sub, {Duration? duration}) async {
    if (_unavailable) return;
    final pending = await _platform.pending();
    if (!canScheduleAdditionalNotification(pending.length)) return;
    final exact = await _platform.canScheduleExact();
    final scheduled =
        tz.TZDateTime.now(tz.local).add(duration ?? snoozeDuration);
    final snoozeId =
        '${sub.id}|snooze|${scheduled.millisecondsSinceEpoch}'.hashCode.abs() %
            _maxNotificationId;

    await _platform.schedule(ScheduledNotification(
      id: snoozeId,
      title: sub.name,
      body: 'Ertelenen hatırlatma — ${sub.amount.amount} ${sub.currency}',
      when: scheduled,
      channelDescription: 'Abonelik yenileme bildirimleri',
      payload: sub.id,
      exact: exact,
      withSnoozeAction: false,
    ));
  }

  @visibleForTesting
  static bool canScheduleAdditionalNotification(int pendingCount) =>
      pendingCount < maxScheduledNotifications;

  @override
  Future<void> sendTestNotification() => showPushNotification(
        title: 'Test Bildirimi',
        body: 'SubscriptTrack bildirimleri çalışıyor ✓',
      );

  /// Uygulama açıkken gelen bir bildirimi hemen gösterir.
  Future<void> showPushNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (_unavailable) return;
    await _platform.show(
      id: Object.hash(title, body, payload).abs() % _maxNotificationId,
      title: title,
      body: body,
      payload: payload,
    );
  }

  @override
  Future<void> cancelAll() async {
    if (_unavailable) return;
    await _platform.cancelAll();
  }

  /// Cihaz kabul testlerinin kullandığı salt-okunur tanılama kancası.
  Future<Set<int>> pendingNotificationIds() async {
    if (_unavailable) return const {};
    return (await _platform.pending()).map((p) => p.id).toSet();
  }

  /// [subscriptionId] aboneliğine ait tüm bekleyen bildirimleri iptal eder.
  /// Ertelenmiş hatırlatmalar da kalkar; böylece silinen veya arşivlenen bir
  /// aboneliğin yetim bildirimi kalmaz.
  @override
  Future<void> cancelForSubscription(String subscriptionId) async {
    if (_unavailable || subscriptionId.isEmpty) return;
    for (final request in await _platform.pending()) {
      if (request.payload == subscriptionId) {
        await _platform.cancel(request.id);
      }
    }
  }
}
