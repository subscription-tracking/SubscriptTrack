import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../domain/app_notification.dart';
import '../notification_controller.dart';

class NotificationCenterScreen extends StatelessWidget {
  const NotificationCenterScreen({
    required this.notificationController,
    required this.subscriptionController,
    super.key,
  });

  final NotificationController notificationController;
  final SubscriptionController subscriptionController;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: notificationController,
      builder: (context, _) => _buildContent(context),
    );
  }

  Widget _buildContent(BuildContext context) {
    final notif = notificationController;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          if (notif.unreadCount > 0)
            TextButton(
              onPressed: notif.markAllRead,
              child: const Text('Tümünü okundu say'),
            ),
        ],
      ),
      body: notif.all.isEmpty
          ? const _EmptyNotifications()
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notif.all.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) => _NotificationTile(
                notification: notif.all[i],
                controller: notif,
                subscriptions: subscriptionController,
              ),
            ),
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.notifications_none_outlined,
              size: 64, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          const Text('Yeni bildirim yok'),
          const SizedBox(height: 8),
          Text(
            'Yaklaşan yenilemeler burada görünür.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.controller,
    required this.subscriptions,
  });

  final AppNotification notification;
  final NotificationController controller;
  final SubscriptionController subscriptions;

  Color _avatarColor(ColorScheme colors, bool read) {
    if (read) return colors.surfaceContainerHighest;
    return switch (notification.type) {
      NotificationType.renewalToday => colors.errorContainer,
      NotificationType.renewalSoon => colors.tertiaryContainer,
      _ => colors.primaryContainer,
    };
  }

  Future<void> _open(BuildContext context) async {
    final n = notification;
    await controller.markRead(n.id);
    if (!context.mounted) return;
    final sub = n.subscriptionId == null
        ? null
        : subscriptions.allItems
            .where((s) => s.id == n.subscriptionId)
            .firstOrNull;
    if (sub != null) {
      unawaited(context.push(AppRoutes.subscription(sub.id)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final n = notification;
    final read = controller.isRead(n.id);

    return Dismissible(
      key: ValueKey(n.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: colors.errorContainer,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Icon(Icons.delete_outline, color: colors.onErrorContainer),
      ),
      onDismissed: (_) => controller.dismiss(n.id),
      child: ListTile(
        onTap: () => _open(context),
        leading: CircleAvatar(
          backgroundColor: _avatarColor(colors, read),
          child: Text(n.type.icon, style: const TextStyle(fontSize: 18)),
        ),
        title: Text(
          n.title,
          style: TextStyle(
            fontWeight: read ? FontWeight.normal : FontWeight.w600,
            color: read ? colors.onSurfaceVariant : null,
          ),
        ),
        subtitle: Text(n.body),
        trailing: read
            ? null
            : CircleAvatar(radius: 5, backgroundColor: colors.primary),
      ),
    );
  }
}
