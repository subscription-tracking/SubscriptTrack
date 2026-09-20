import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/notifications/presentation/screens/notification_center_screen.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';

/// The shared top bar for every tab — same tall, icon + subtitle + title
/// layout everywhere (the style the dashboard originally introduced), so
/// switching tabs never visually jumps. Each tab supplies its own icon,
/// title and optional subtitle.
class TopBar extends StatelessWidget implements PreferredSizeWidget {
  const TopBar({
    required this.icon,
    required this.title,
    this.subtitle,
    super.key,
  });

  final IconData icon;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationController>().unreadCount;
    final cs = Theme.of(context).colorScheme;

    return AppBar(
      toolbarHeight: 88,
      titleSpacing: 20,
      backgroundColor: cs.surfaceContainerLowest,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      title: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: cs.primary, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (subtitle != null) ...[
                  Text(subtitle!,
                      style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 2),
                ],
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ],
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
          onPressed: () {
            final subscriptions = context.read<SubscriptionController>();
            Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => Scaffold(
                  appBar: AppBar(title: const Text('Takvim')),
                  body: CalendarScreen(controller: subscriptions),
                ),
              ),
            );
          },
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
            onPressed: () {
              final notifController = context.read<NotificationController>();
              final subsController = context.read<SubscriptionController>();
              Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => NotificationCenterScreen(
                    notificationController: notifController,
                    subscriptionController: subsController,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(88);
}
