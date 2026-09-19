import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/screens/subscription_detail_screen.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../domain/app_notification.dart';
import '../notification_controller.dart';

class NotificationCenterScreen extends StatelessWidget {
  const NotificationCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notif = context.watch<NotificationController>();
    final subs = context.read<SubscriptionController>();
    final colors = Theme.of(context).colorScheme;

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
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none_outlined,
                      size: 64, color: colors.primary),
                  const SizedBox(height: 16),
                  const Text('Yeni bildirim yok'),
                  const SizedBox(height: 8),
                  Text(
                    'Yaklaşan yenilemeler burada görünür.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notif.all.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final n = notif.all[i];
                final read = notif.isRead(n.id);
                Subscription? sub;
                if (n.subscriptionId != null) {
                  try {
                    sub = subs.allItems
                        .firstWhere((s) => s.id == n.subscriptionId);
                  } catch (_) {}
                }

                return Dismissible(
                  key: ValueKey(n.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: colors.errorContainer,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Icon(Icons.delete_outline,
                        color: colors.onErrorContainer),
                  ),
                  onDismissed: (_) => notif.dismiss(n.id),
                  child: ListTile(
                    onTap: () async {
                      await notif.markRead(n.id);
                      if (!context.mounted) return;
                      if (sub != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) => SubscriptionDetailScreen(
                              subscription: sub!,
                              controller: subs,
                            ),
                          ),
                        );
                      }
                    },
                    leading: CircleAvatar(
                      backgroundColor: read
                          ? colors.surfaceContainerHighest
                          : n.type == NotificationType.renewalToday
                              ? colors.errorContainer
                              : n.type == NotificationType.renewalSoon
                                  ? colors.tertiaryContainer
                                  : colors.primaryContainer,
                      child: Text(n.type.icon,
                          style: const TextStyle(fontSize: 18)),
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
                        : CircleAvatar(
                            radius: 5,
                            backgroundColor: colors.primary,
                          ),
                  ),
                );
              },
            ),
    );
  }
}
