import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/navigation/app_routes.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../shared/design/app_tokens.dart';

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
      toolbarHeight: AppSizes.topBarHeight,
      titleSpacing: 20,
      backgroundColor: cs.surfaceContainerLowest,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      title: _title(context),
      actions: [
        IconButton(
          icon: Icon(
            Icons.calendar_month_outlined,
            color: cs.onSurfaceVariant,
          ),
          tooltip: 'Takvim',
          onPressed: () => context.push(AppRoutes.calendar),
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
            onPressed: () => context.push(AppRoutes.notifications),
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _title(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final sub = subtitle;
    return Row(
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
              if (sub != null) ...[
                Text(sub, style: textTheme.labelSmall),
                const SizedBox(height: 2),
              ],
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(AppSizes.topBarHeight);
}
