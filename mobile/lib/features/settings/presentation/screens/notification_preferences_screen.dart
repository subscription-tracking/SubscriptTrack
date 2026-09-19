import 'package:flutter/material.dart';

import '../../../../core/services/local_notification_service.dart';
import '../settings_controller.dart';

class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({required this.controller, super.key});

  final SettingsController controller;

  @override
  State<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends State<NotificationPreferencesScreen> {
  bool _requestingPermission = false;

  Future<void> _toggleNotifications(bool value) async {
    if (value) {
      setState(() => _requestingPermission = true);
      final granted = await LocalNotificationService.requestPermission();
      setState(() => _requestingPermission = false);
      if (!granted && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Bildirim izni verilmedi. Ayarlardan açabilirsin.')),
        );
        return;
      }
    } else {
      await LocalNotificationService.cancelAll();
    }
    await widget.controller.setNotifications(value);
  }

  Future<void> _sendTest() async {
    await LocalNotificationService.sendTestNotification();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Test bildirimi gönderildi.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = widget.controller;

    return Scaffold(
      appBar: AppBar(title: const Text('Bildirimler')),
      body: ListenableBuilder(
        listenable: ctrl,
        builder: (context, _) => ListView(
          children: [
            SwitchListTile(
              title: const Text('Yenileme bildirimleri'),
              subtitle: const Text('Abonelik yenilenmeden önce bildirim al'),
              secondary: _requestingPermission
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.notifications_outlined),
              value: ctrl.notificationsEnabled,
              onChanged: _requestingPermission ? null : _toggleNotifications,
            ),
            if (ctrl.notificationsEnabled) ...[
              const Divider(),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text('Kaç gün önce hatırlatılsın?',
                    style: Theme.of(context).textTheme.labelLarge),
              ),
              RadioGroup<int>(
                groupValue: ctrl.daysBefore,
                onChanged: (v) async {
                  if (v != null) await ctrl.setDaysBefore(v);
                },
                child: Column(
                  children: [1, 3, 7]
                      .map((days) => RadioListTile<int>(
                            title: Text(
                                days == 1 ? '1 gün önce' : '$days gün önce'),
                            value: days,
                          ))
                      .toList(),
                ),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.send_outlined),
                title: const Text('Test bildirimi gönder'),
                subtitle: const Text('Bildirimlerin çalıştığını doğrula'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _sendTest,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
