import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/notifications/presentation/screens/notification_center_screen.dart';

class TopBar extends StatelessWidget implements PreferredSizeWidget {
  const TopBar({this.title, super.key});

  final String? title;

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationController>().unreadCount;
    final cs = Theme.of(context).colorScheme;

    return AppBar(
      backgroundColor: cs.surfaceContainerLowest,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: cs.primary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              'SubscriptTrack',
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: cs.primary,
                fontWeight: FontWeight.w800,
                fontSize: 18,
                letterSpacing: -0.5,
              ),
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            Icons.calendar_month_outlined,
            color: cs.onSurfaceVariant,
          ),
          tooltip: 'Takvim',
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => Scaffold(
                appBar: AppBar(title: const Text('Takvim')),
                body: const CalendarScreen(),
              ),
            ),
          ),
        ),
        Badge(
          isLabelVisible: unread > 0,
          label: Text('$unread'),
          backgroundColor: cs.error,
          textColor: Colors.white,
          child: IconButton(
            icon: Icon(
              Icons.notifications_outlined,
              color: cs.onSurfaceVariant,
            ),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => const NotificationCenterScreen(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
