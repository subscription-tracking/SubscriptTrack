import 'package:flutter/material.dart';

class EmptyDayState extends StatelessWidget {
  const EmptyDayState(
      {super.key, required this.hasSelection, this.onAddForDay});
  final bool hasSelection;
  final VoidCallback? onAddForDay;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.primary.withValues(alpha: 0.08),
              border: Border.all(
                  color: cs.primary.withValues(alpha: 0.18), width: 0.5),
            ),
            child: Icon(
              hasSelection
                  ? Icons.check_circle_outline_rounded
                  : Icons.touch_app_rounded,
              size: 24,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            hasSelection ? 'Bu gün yenileme yok' : 'Bir gün seç',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
          ),
          if (onAddForDay != null) ...[
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: onAddForDay,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Bu tarihte başlayan abonelik ekle'),
            ),
          ],
        ],
      ),
    );
  }
}
