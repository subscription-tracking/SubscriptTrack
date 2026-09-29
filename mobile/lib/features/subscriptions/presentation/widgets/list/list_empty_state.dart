import 'package:flutter/material.dart';

import '../../../../../shared/widgets/app_empty_state.dart';

class SubscriptionListEmptyState extends StatelessWidget {
  const SubscriptionListEmptyState(
      {required this.message, required this.detail, this.onAdd, super.key});
  final String message;
  final String detail;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: AppEmptyState(
          icon: Icons.grid_view_rounded,
          title: message,
          description: detail,
          actionLabel: onAdd == null ? null : 'Abonelik ekle',
          onAction: onAdd,
        ),
      ),
    );
  }
}
