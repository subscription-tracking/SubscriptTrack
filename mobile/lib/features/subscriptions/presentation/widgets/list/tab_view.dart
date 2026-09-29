import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/navigation/app_routes.dart';
import '../../../../../shared/design/app_tokens.dart';
import '../../../domain/subscription_models.dart';
import '../../subscription_controller.dart';
import 'list_empty_state.dart';
import 'subscription_tile.dart';

class SubscriptionTabView extends StatelessWidget {
  const SubscriptionTabView({
    required this.items,
    required this.allEmpty,
    required this.emptyMessage,
    required this.emptyDetail,
    required this.controller,
    required this.onRefresh,
    this.onAdd,
    this.showAddButton = false,
    this.selectionMode = false,
    this.selectedIds = const {},
    this.onLongPress,
    this.onToggleSelect,
    this.showStatus = true,
    super.key,
  });

  final List<Subscription> items;
  final bool allEmpty;
  final String emptyMessage;
  final String emptyDetail;
  final SubscriptionController controller;
  final Future<void> Function() onRefresh;
  final VoidCallback? onAdd;
  final bool showAddButton;
  final bool selectionMode;
  final Set<String> selectedIds;
  final ValueChanged<String>? onLongPress;
  final ValueChanged<String>? onToggleSelect;
  final bool showStatus;

  @override
  Widget build(BuildContext context) {
    if (allEmpty) {
      return SubscriptionListEmptyState(
        message: emptyMessage,
        detail: emptyDetail,
        onAdd: showAddButton ? onAdd : null,
      );
    }
    if (items.isEmpty) {
      return Center(
        child: Text(
          'Sonuç bulunamadı.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      );
    }

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainer,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: AppSpacing.screenWithBottomNav(context),
        itemCount: items.length + (controller.hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          if (i == items.length) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              controller.loadMore();
            });
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final sub = items[i];
          return SubscriptionListTile(
            subscription: sub,
            selectionMode: selectionMode,
            selected: selectedIds.contains(sub.id),
            onTap: () {
              if (selectionMode) {
                onToggleSelect?.call(sub.id);
              } else {
                context.push(AppRoutes.subscription(sub.id));
              }
            },
            onLongPress: () => onLongPress?.call(sub.id),
            showStatus: showStatus,
          );
        },
      ),
    );
  }
}
