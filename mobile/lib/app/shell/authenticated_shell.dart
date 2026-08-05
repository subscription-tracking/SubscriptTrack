import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/settings/presentation/settings_controller.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import '../../core/config/app_environment.dart';
import '../../core/network/api_client.dart';
import '../../core/network/token_provider.dart';
import '../../core/services/device_token_service.dart';
import '../../core/services/local_notification_service.dart';
import '../../core/services/notification_read_sync_service.dart';
import 'app_shell.dart';

class AuthenticatedShell extends StatefulWidget {
  const AuthenticatedShell({super.key});

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell> {
  SubscriptionController? _subs;
  NotificationController? _notif;
  ApiClient? _apiClient;
  String? _userId;

  // Track last known notification settings to detect changes.
  int _lastDaysBefore = -1;
  String _lastTimezone = '__unset__';

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) {
      // Router guard should prevent this; force sign-out so the redirect fires.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) auth.signOut();
      });
      return;
    }
    _userId = user.id;
    _apiClient = EnvironmentConfig.isApiConfigured
        ? ApiClient(tokenProvider: SupabaseTokenProvider())
        : null;
    _subs = SubscriptionController(
      userId: user.id,
      onUnauthorized: () => auth.signOut(),
    );
    final readSync = _apiClient != null
        ? NotificationReadSyncService(_apiClient!)
        : null;
    _notif = NotificationController(readSyncService: readSync);
    _notif!.loadReadState();
    _subs!.addListener(_onSubscriptionsChanged);
    // Listen for settings changes to reschedule notifications.
    SettingsController.instance.addListener(_onSettingsChanged);
    _subs!.load();
    // Register push token best-effort after first frame.
    WidgetsBinding.instance.addPostFrameCallback((_) => _registerDeviceToken());
  }

  Future<void> _registerDeviceToken() async {
    final client = _apiClient;
    final uid = _userId;
    if (client == null || uid == null) return;
    await ApiDeviceTokenService().registerToken(uid, client);
  }

  void _onSubscriptionsChanged() {
    if (_subs == null || _notif == null) return;
    _notif!.refresh(_subs!.active);
    _scheduleNotifications();
  }

  void _onSettingsChanged() {
    final settings = SettingsController.instance;
    final daysChanged = settings.daysBefore != _lastDaysBefore;
    final tzChanged = settings.timezone != _lastTimezone;
    if (daysChanged || tzChanged) {
      _scheduleNotifications();
    }
  }

  void _scheduleNotifications() {
    if (_subs == null) return;
    final settings = SettingsController.instance;
    if (!settings.notificationsEnabled) {
      LocalNotificationService.cancelAll();
      return;
    }
    _lastDaysBefore = settings.daysBefore;
    _lastTimezone = settings.timezone;
    LocalNotificationService.scheduleRenewalReminders(
      _subs!.active,
      settings.daysBefore,
      timezone: settings.timezone,
    );
  }

  @override
  void dispose() {
    SettingsController.instance.removeListener(_onSettingsChanged);
    _subs?.removeListener(_onSubscriptionsChanged);
    _subs?.dispose();
    _notif?.dispose();
    // Revoke device token on sign-out (best-effort, fire-and-forget).
    final client = _apiClient;
    final uid = _userId;
    if (client != null && uid != null) {
      ApiDeviceTokenService().revokeToken(uid, client);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // _subs/_notif are null only if initState bailed out due to missing user.
    // signOut was already queued; show nothing while the redirect fires.
    if (_subs == null || _notif == null) return const SizedBox.shrink();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SubscriptionController>.value(value: _subs!),
        ChangeNotifierProvider<NotificationController>.value(value: _notif!),
      ],
      child: const AppShell(),
    );
  }
}
