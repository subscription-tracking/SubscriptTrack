import 'package:flutter/material.dart';

import '../settings_controller.dart';

class NotificationPreferencesScreen extends StatelessWidget {
  const NotificationPreferencesScreen({required this.controller, super.key});

  final SettingsController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bildirimler')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => ListView(
          children: [
            SwitchListTile(
              title: const Text('Yenileme bildirimleri'),
              subtitle: const Text(
                  'Abonelik yenilenmeden önce bildirim al'),
              secondary: const Icon(Icons.notifications_outlined),
              value: controller.notificationsEnabled,
              onChanged: controller.setNotifications,
            ),
            if (controller.notificationsEnabled) ...[
              const Divider(),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text(
                  'Bildirimler Supabase entegrasyonu tamamlandığında aktif olacak.',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
