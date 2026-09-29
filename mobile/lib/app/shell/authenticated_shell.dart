import 'dart:async';

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/domain/money.dart';
import '../../core/navigation/app_routes.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/notifications/domain/notification_rule.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/settings/presentation/settings_controller.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import '../../features/subscriptions/domain/subscription_models.dart';
import '../../core/services/notification_scheduler.dart';
import '../../core/services/notification_read_sync_service.dart';

/// Login ekranındaki "Test hesabıyla gir" kısayolu — boş bir panelle test
/// etmek anlamsız olduğundan, bu hesap ilk kez giriş yapıp hiç aboneliği
/// yokken birkaç örnek abonelik ekleriz.
const _testAccountEmail = 'testkullanici@subscripttrack.app';

class AuthenticatedShell extends StatefulWidget {
  const AuthenticatedShell({required this.child, super.key});

  /// Kabuğun altındaki rota içeriği (GoRouter `ShellRoute` navigator'ı).
  final Widget child;

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell>
    with WidgetsBindingObserver {
  late final SettingsController _settings;
  late final NotificationScheduler _notifications;
  SubscriptionController? _subs;
  NotificationController? _notif;
  String? _userId;

  int _lastDaysBefore = -1;
  int _lastReminderHour = -1;
  String _lastTimezone = '__unset__';
  String? _pendingNotificationSubscriptionId;

  @override
  void initState() {
    super.initState();
    _settings = context.read<SettingsController>();
    _notifications = context.read<NotificationScheduler>();
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) auth.signOut();
      });
      return;
    }
    _userId = user.id;
    _subs = SubscriptionController(
      userId: user.id,
      notifications: _notifications,
      onUnauthorized: () => auth.signOut(),
    );
    _notif = NotificationController(
      readSyncService: NotificationReadSyncService(),
    );
    _notif!.loadReadState();
    _subs!.addListener(_onSubscriptionsChanged);
    _settings.addListener(_onSettingsChanged);
    WidgetsBinding.instance.addObserver(this);
    _subs!.load().then((_) => _seedTestAccountIfEmpty(user.email));
    _notif!.load(user.id).catchError((_) {});
    _notifications.onNotificationTap = _handleNotificationTap;
    _notifications.onSnoozeRequested = _handleSnoozeRequested;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleColdStartNotification();
    });
  }

  Future<void> _seedTestAccountIfEmpty(String email) async {
    // Örnek veri yalnızca debug build'lerde tohumlanır.
    if (!kDebugMode) return;
    if (email.trim().toLowerCase() != _testAccountEmail) return;
    final subs = _subs;
    if (subs == null || subs.allItems.isNotEmpty) return;

    final now = DateTime.now();
    const samples = [
      (
        name: 'Netflix',
        category: SubscriptionCategory.streaming,
        amount: '249.99',
        cycle: BillingCycle.monthly,
        daysUntilRenewal: 12,
      ),
      (
        name: 'Spotify',
        category: SubscriptionCategory.music,
        amount: '59.99',
        cycle: BillingCycle.monthly,
        daysUntilRenewal: 4,
      ),
      (
        name: 'iCloud+',
        category: SubscriptionCategory.cloud,
        amount: '32.99',
        cycle: BillingCycle.monthly,
        daysUntilRenewal: 20,
      ),
    ];
    for (final sample in samples) {
      final nextRenewal = now.add(Duration(days: sample.daysUntilRenewal));
      await subs.add(
        name: sample.name,
        amount: Money.parse(sample.amount),
        currency: 'TRY',
        billingCycle: sample.cycle,
        startDate: now,
        nextRenewalDate: nextRenewal,
        category: sample.category,
        notificationRules: const [NotificationRule(daysBefore: 3)],
      );
    }
  }

  /// Uygulama, kapalıyken bir bildirime dokunularak açıldıysa (Test 35'in
  /// "cold start" durumu), ilk frame sonrası ilgili detay ekranına gider.
  Future<void> _handleColdStartNotification() async {
    final id = await _notifications.getLaunchNotificationSubscriptionId();
    if (id != null) _handleNotificationTap(id);
  }

  Subscription? _findSubscription(String id) {
    for (final sub in _subs?.allItems ?? const <Subscription>[]) {
      if (sub.id == id) return sub;
    }
    return null;
  }

  void _handleNotificationTap(String subscriptionId) {
    final sub = _findSubscription(subscriptionId);
    if (sub == null) {
      // Cold-start durumunda abonelikler henüz yüklenmemiş olabilir. Kimliği
      // saklayıp controller yüklemeyi bitirdiğinde yönlendireceğiz.
      _pendingNotificationSubscriptionId = subscriptionId;
      return;
    }
    if (!mounted) return;
    _pendingNotificationSubscriptionId = null;
    GoRouter.of(context).push(AppRoutes.subscription(sub.id));
  }

  void _handleSnoozeRequested(String subscriptionId) {
    final sub = _findSubscription(subscriptionId);
    if (sub == null) return;
    _notifications.snooze(sub);
  }

  void _onSubscriptionsChanged() {
    if (_subs == null || _notif == null) return;
    _notif!.refresh(_subs!.active, trials: _subs!.trials);
    _scheduleNotifications();
    final uid = _userId;
    if (uid != null) _notif!.load(uid).catchError((_) {});
    final pendingId = _pendingNotificationSubscriptionId;
    if (pendingId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _pendingNotificationSubscriptionId == pendingId) {
          _handleNotificationTap(pendingId);
        }
      });
    }
  }

  void _onSettingsChanged() {
    final settings = _settings;
    if (settings.daysBefore != _lastDaysBefore ||
        settings.timezone != _lastTimezone ||
        settings.reminderHour != _lastReminderHour) {
      _scheduleNotifications();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    unawaited(_refreshDeviceTimezone());
  }

  Future<void> _refreshDeviceTimezone() async {
    if (await _notifications.refreshDeviceLocalTimezone()) {
      _scheduleNotifications();
    }
  }

  void _scheduleNotifications() {
    if (_subs == null) return;
    final settings = _settings;
    if (!settings.notificationsEnabled) {
      _notifications.cancelAll();
      return;
    }
    _lastDaysBefore = settings.daysBefore;
    _lastTimezone = settings.timezone;
    _lastReminderHour = settings.reminderHour;
    _notifications.scheduleRenewalReminders(
      _subs!.active,
      settings.daysBefore,
      timezone: settings.timezone,
      trials: _subs!.trials,
      reminderHour: settings.reminderHour,
    );
  }

  @override
  void dispose() {
    // Yöntem tear-off'ları `==` ile eşleşir ama `identical` ile eşleşmez.
    _settings.removeListener(_onSettingsChanged);
    WidgetsBinding.instance.removeObserver(this);
    _subs?.removeListener(_onSubscriptionsChanged);
    if (_notifications.onNotificationTap == _handleNotificationTap) {
      _notifications.onNotificationTap = null;
    }
    if (_notifications.onSnoozeRequested == _handleSnoozeRequested) {
      _notifications.onSnoozeRequested = null;
    }
    _subs?.dispose();
    _notif?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_subs == null || _notif == null) return const SizedBox.shrink();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SubscriptionController>.value(value: _subs!),
        ChangeNotifierProvider<NotificationController>.value(value: _notif!),
      ],
      child: widget.child,
    );
  }
}
