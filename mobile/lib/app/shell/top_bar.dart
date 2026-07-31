import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/notifications/presentation/screens/notification_center_screen.dart';

class TopBar extends StatelessWidget implements PreferredSizeWidget {
  const TopBar({required this.title, super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationController>().unreadCount;

    return AppBar(
      title: Text(title),
      actions: [
        Badge(
          isLabelVisible: unread > 0,
          label: Text('$unread'),
          child: IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => const NotificationCenterScreen(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
