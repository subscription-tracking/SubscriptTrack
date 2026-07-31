import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/settings/presentation/settings_controller.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import '../../core/services/local_notification_service.dart';
import 'app_shell.dart';

class AuthenticatedShell extends StatefulWidget {
  const AuthenticatedShell({super.key});

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell> {
  late final SubscriptionController _subs;
  late final NotificationController _notif;

  @override
  void initState() {
    super.initState();
    final userId = context.read<AuthController>().user!.id;
    _subs = SubscriptionController(userId: userId);
    _notif = NotificationController();
    _subs.addListener(_onSubscriptionsChanged);
    _subs.load();
  }

  void _onSubscriptionsChanged() {
    _notif.refresh(_subs.active);

    final settings = SettingsController.instance;
    if (settings.notificationsEnabled) {
      LocalNotificationService.scheduleRenewalReminders(
        _subs.active,
        settings.daysBefore,
        timezone: settings.timezone,
      );
    }
  }

  @override
  void dispose() {
    _subs.removeListener(_onSubscriptionsChanged);
    _subs.dispose();
    _notif.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MultiProvider(
        providers: [
          ChangeNotifierProvider<SubscriptionController>.value(value: _subs),
          ChangeNotifierProvider<NotificationController>.value(value: _notif),
        ],
        child: const AppShell(),
      );
}
