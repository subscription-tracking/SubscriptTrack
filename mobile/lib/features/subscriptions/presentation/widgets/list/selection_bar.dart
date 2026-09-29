import 'package:flutter/material.dart';

class SubscriptionSelectionBar extends StatelessWidget {
  const SubscriptionSelectionBar({
    required this.count,
    required this.onCancel,
    required this.onArchive,
    required this.onDelete,
    super.key,
  });

  final int count;
  final VoidCallback onCancel;
  final VoidCallback onArchive;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close),
            tooltip: 'Seçimi iptal et',
            onPressed: onCancel,
          ),
          Expanded(
            child: Text(
              '$count seçildi',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          OutlinedButton.icon(
            onPressed: count == 0 ? null : onArchive,
            icon: const Icon(Icons.archive_outlined, size: 18),
            label: const Text('Arşivle'),
          ),
          const SizedBox(width: 8),
          FilledButton.icon(
            onPressed: count == 0 ? null : onDelete,
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            icon: const Icon(Icons.delete_outline, size: 18),
            label: const Text('Sil'),
          ),
        ],
      ),
    );
  }
}
